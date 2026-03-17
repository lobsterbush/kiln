-- Migration 011: Add scenario_solo and scenario_multi to activities.type CHECK
--
-- Problem: migration 006 dropped and recreated activities_type_check to add
-- peer_clarification and evidence_analysis, but did NOT include scenario_solo
-- and scenario_multi. Migration 009 added scenario_messages / scenario_evaluations
-- but also did not update the constraint. As a result any INSERT into activities
-- with type = 'scenario_solo' or 'scenario_multi' fails the constraint.
--
-- Fix: drop the existing constraint and replace it with one that includes
-- all six non-legacy types plus both scenario types.

ALTER TABLE activities
  DROP CONSTRAINT IF EXISTS activities_type_check;

ALTER TABLE activities
  ADD CONSTRAINT activities_type_check
  CHECK (type IN (
    'peer_critique', 'socratic_chain', 'evidence_eval', 'concept_synthesis',
    'peer_clarification', 'evidence_analysis',
    'scenario_solo', 'scenario_multi'
  ));
