import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { DrillId } from '../../data/trainingTypes';
import { BobsGame } from './drills/BobsGame';
import { HundredDartsT20 } from './drills/HundredDartsT20';
import { BigTrebles } from './drills/BigTrebles';
import { FirstNineTracker } from './drills/FirstNineTracker';
import { T20T19Bull } from './drills/T20T19Bull';
import { RoundClockDoubles } from './drills/RoundClockDoubles';
import { PressureDoubles } from './drills/PressureDoubles';
import { Checkout121 } from './drills/Checkout121';
import { FinishingPyramid } from './drills/FinishingPyramid';
import { Game201 } from './drills/Game201';
import { BullChallenge } from './drills/BullChallenge';
import { Frustration } from './drills/Frustration';

const DRILL_COMPONENTS: Record<DrillId, React.ComponentType> = {
  bobs_27: BobsGame,
  hundred_darts_t20: HundredDartsT20,
  big_trebles: BigTrebles,
  first_nine_tracker: FirstNineTracker,
  t20_t19_bull: T20T19Bull,
  round_clock_doubles: RoundClockDoubles,
  pressure_doubles: PressureDoubles,
  checkout_121: Checkout121,
  finishing_pyramid: FinishingPyramid,
  game_201: Game201,
  bull_challenge: BullChallenge,
  frustration: Frustration,
};

export function DrillRouter() {
  const { drillId } = useParams<{ drillId: string }>();
  const Component = DRILL_COMPONENTS[drillId as DrillId];
  if (!Component) return <Navigate to="/training" replace />;
  return <Component />;
}
