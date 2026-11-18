-- READ-ONLY. SELECT statements only; safe to run against production.
-- Run:  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f scripts/audit/05_hydroponics_out_of_bounds.sql
-- (or paste into the Neon SQL editor). See scripts/audit/README.md.
--
-- Hydroponics saves that the game rules cannot produce. The save used to be
-- written verbatim by the browser, so these are forged or poisoned states.
-- Bounds (src/lib/hydroponics/config.ts and server-sanitize.ts):
--   inventory      500 units in total, 750 with the Storage Expansion tech;
--                  the server now clamps one stack at 10,000
--   properties     15 exist (p1..p15), each owned at most once, 3..30 plots each
--   staff          at most 30, wage never below 0 (the smallest legal wage is
--                  75% of baseWage x skill; a negative wage paid the player)
--   research       at most 100,000 points
--   events         none should be stored (random events are dormant; a stored
--                  one only ever acted as a 3x multiplier)
-- The server sanitizes a save the next time its owner loads it, so a row can
-- appear here simply because that pilot has not played since the fix. What
-- matters is the size of the numbers and whether the pilot is also in
-- 01_credit_outliers.sql.

WITH h AS (
  SELECT d."pilotId", p."callsign", p."level", p."credits", d."updatedAt", d."gameState"::jsonb AS gs
  FROM "HydroponicsData" d
  JOIN "PilotState" p ON p."id" = d."pilotId"
),
inv AS (
  SELECT h."pilotId",
         COALESCE(sum((e.value #>> '{}')::numeric) FILTER (WHERE jsonb_typeof(e.value) = 'number'), 0) AS inventory_total,
         COALESCE(max((e.value #>> '{}')::numeric) FILTER (WHERE jsonb_typeof(e.value) = 'number'), 0) AS biggest_stack,
         COALESCE(min((e.value #>> '{}')::numeric) FILTER (WHERE jsonb_typeof(e.value) = 'number'), 0) AS smallest_stack
  FROM h
  LEFT JOIN LATERAL jsonb_each(CASE WHEN jsonb_typeof(h.gs -> 'inventory') = 'object' THEN h.gs -> 'inventory' ELSE '{}'::jsonb END) e ON true
  GROUP BY h."pilotId"
),
staff AS (
  SELECT h."pilotId",
         count(s.value) AS staff_count,
         COALESCE(min((s.value ->> 'wagePerHour')::numeric) FILTER (WHERE jsonb_typeof(s.value -> 'wagePerHour') = 'number'), 0) AS lowest_wage
  FROM h
  LEFT JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(h.gs -> 'staff') = 'array' THEN h.gs -> 'staff' ELSE '[]'::jsonb END) s ON true
  GROUP BY h."pilotId"
),
props AS (
  SELECT h."pilotId",
         count(pr.value) AS property_count,
         count(DISTINCT pr.value ->> 'id') AS distinct_properties,
         count(*) FILTER (WHERE pr.value IS NOT NULL AND COALESCE(pr.value ->> 'id', '') !~ '^p([1-9]|1[0-5])$') AS unknown_properties,
         COALESCE(max(CASE WHEN jsonb_typeof(pr.value -> 'plots') = 'array' THEN jsonb_array_length(pr.value -> 'plots') ELSE 0 END), 0) AS most_plots
  FROM h
  LEFT JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(h.gs -> 'properties') = 'array' THEN h.gs -> 'properties' ELSE '[]'::jsonb END) pr ON true
  GROUP BY h."pilotId"
),
misc AS (
  SELECT h."pilotId",
         CASE WHEN jsonb_typeof(h.gs -> 'researchPoints') = 'number' THEN (h.gs ->> 'researchPoints')::numeric ELSE 0 END AS research_points,
         CASE WHEN jsonb_typeof(h.gs -> 'activeEvents') = 'array' THEN jsonb_array_length(h.gs -> 'activeEvents') ELSE 0 END AS stored_events,
         CASE WHEN jsonb_typeof(h.gs -> 'totalCreditsEarned') = 'number' THEN (h.gs ->> 'totalCreditsEarned')::numeric ELSE 0 END AS total_credits_earned
  FROM h
)
SELECT h."callsign", h."level", h."credits", h."updatedAt",
       inv.inventory_total, inv.biggest_stack, staff.staff_count, staff.lowest_wage,
       props.property_count, props.most_plots, misc.research_points, misc.stored_events, misc.total_credits_earned,
       concat_ws(', ',
         CASE WHEN inv.inventory_total > 750 THEN 'inventory over 750' END,
         CASE WHEN inv.smallest_stack < 0 THEN 'negative stack' END,
         CASE WHEN staff.lowest_wage < 0 THEN 'negative wage' END,
         CASE WHEN staff.staff_count > 30 THEN 'more than 30 staff' END,
         CASE WHEN props.property_count > 15 THEN 'more than 15 properties' END,
         CASE WHEN props.property_count <> props.distinct_properties THEN 'same property twice' END,
         CASE WHEN props.unknown_properties > 0 THEN 'unknown property id' END,
         CASE WHEN props.most_plots > 30 THEN 'property with over 30 plots' END,
         CASE WHEN misc.research_points > 100000 OR misc.research_points < 0 THEN 'research points out of range' END,
         CASE WHEN misc.stored_events > 0 THEN 'stored active event' END) AS flags,
       h."pilotId" AS pilot_id
FROM h
JOIN inv USING ("pilotId")
JOIN staff USING ("pilotId")
JOIN props USING ("pilotId")
JOIN misc USING ("pilotId")
WHERE inv.inventory_total > 750 OR inv.smallest_stack < 0
   OR staff.lowest_wage < 0 OR staff.staff_count > 30
   OR props.property_count > 15 OR props.property_count <> props.distinct_properties
   OR props.unknown_properties > 0 OR props.most_plots > 30
   OR misc.research_points > 100000 OR misc.research_points < 0
   OR misc.stored_events > 0
ORDER BY inv.inventory_total DESC, h."credits" DESC
LIMIT 500;
