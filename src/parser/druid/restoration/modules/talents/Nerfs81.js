import React from 'react';
import TraitStatisticBox, { STATISTIC_ORDER } from 'interface/others/TraitStatisticBox';
import { formatPercentage } from 'common/format';
import SpellIcon from 'common/SpellIcon';

import SPELLS from 'common/SPELLS';
import Analyzer from 'parser/core/Analyzer';
import Mastery from '../core/Mastery';

/*
  Wild Growth healing increased by 10%
  Tranq direct healing decreased by 10%
  Tranq HoT decreased by 40%
 */

const WILD_GROWTH_BUFF = 0.1;
const TRANQ_HOT_NERF = 0.4;
const TRANQ_DIRECT_HEAL_NERF = 0.1;

class Nerfs81 extends Analyzer {
  static dependencies = {
    mastery: Mastery,
  };

  wgGain = 0;
  tranqHotDecrease = 0;
  tranqDirectDecrease = 0;

  on_byPlayer_heal(event) {
    const spellId = event.ability.guid;

    if(spellId === SPELLS.WILD_GROWTH.id) {
      const effectiveHealing = event.amount + (event.absorbed || 0);
      const hitPointsRemaining = event.maxHitPoints - event.hitPoints;
      if(hitPointsRemaining > 0) {
        const healGained = effectiveHealing * WILD_GROWTH_BUFF;
        this.wgGain += Math.min(hitPointsRemaining, healGained);
      }
    }

    if(spellId === SPELLS.TRANQUILITY_HEAL.id) {
      const rawHealing = event.amount + (event.absorbed || 0) + (event.overheal || 0);
      if(event.tick) {
        const healingNerf = rawHealing * TRANQ_HOT_NERF;
        this.tranqHotDecrease += Math.max(healingNerf - (event.overheal || 0), 0);
      } else {
        const nerf = rawHealing * TRANQ_DIRECT_HEAL_NERF;
        this.tranqDirectDecrease += Math.max(nerf - (event.overheal || 0), 0);
      }
    }
  }

  statistic() {
    const wg = this.owner.getPercentageOfTotalHealingDone(this.wgGain);
    const tranqHoT = this.owner.getPercentageOfTotalHealingDone(this.tranqHotDecrease);
    const tranqDirect = this.owner.getPercentageOfTotalHealingDone(this.tranqDirectDecrease);

    const result = wg - tranqHoT - tranqDirect;

    return (
      <TraitStatisticBox
        icon={<SpellIcon id={SPELLS.WILD_GROWTH.id} />}
        label="8.1 nerfs lol"
        value={(
          <>
            WG GAIN: {formatPercentage(wg)}%  <br />
            Tranq HoT nerf: {formatPercentage(tranqHoT)}% <br />
            Tranq Direct heal nerf: {formatPercentage(tranqDirect)}% <br />
            Result = {formatPercentage(result)}%
          </>
        )}
      />
    );
  }
  statisticOrder = STATISTIC_ORDER.OPTIONAL();

}

export default Nerfs81;
