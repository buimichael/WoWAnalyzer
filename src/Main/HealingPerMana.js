import React from 'react';
import PropTypes from 'prop-types';
import ReactTooltip from 'react-tooltip';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import SpellManaCost from '../Parser/Core/Modules/SpellManaCost';
import SPECS from 'common/SPECS';
import SpellLink from 'common/SpellLink';
import Icon from 'common/Icon';
import SPELLS from 'common/SPELLS';

import { formatNumber, formatPercentage, formatDuration } from 'common/format';

class HealingPerMana extends React.Component {
  static propTypes = {
    parser: PropTypes.object.isRequired,
    spellManaCost: SpellManaCost,
  };

  constructor(props) {
    super(props);
    this.state = {
      ...this.state,
      maxPlayerHealthPercentage: 0.35,
      minHealOfMaxHealthPercentage: 0.1,
    };
  }

  componentDidUpdate() {
    ReactTooltip.rebuild();
  }

  render() {
    const { parser } = this.props;
    const events = parser.modules.healEventTracker.events;
    const fightStart = parser.fight.start_time;

    let total = 0;
    let count = 0;
    let totalBigHealing = 0;
    let bigHealCount = 0;
    let rejuvenationHpm = 0;
    let wgHpm = 0;
    let tranqHpm = 0;
    let regrowthHpm = 0;
    let totalManaUsed = 0;

    const sliderProps = {
      min: 0,
      max: 1,
      step: 0.05,
      marks: {
        0: '0%',
        0.1: '10%',
        0.2: '20%',
        0.3: '30%',
        0.4: '40%',
        0.5: '50%',
        0.6: '60%',
        0.7: '70%',
        0.8: '80%',
        0.9: '90%',
        1: '100%',
      },
      style: { marginBottom: '2em' },
    };

    return (
      <div>
        <table className="data-table">
          <tbody>
            <tr>
              <td colSpan="7">
                The amount of healing you did with each ability (not including overhealing) weighted by total mana spent. Avoid casting spells with low healing per mana (HPM).
              </td>
            </tr>
            {
              events
                .map((event) => {
                  const effectiveHealing = event.amount + (event.absorbed || 0);
                  const hitPointsBeforeHeal = event.hitPoints - effectiveHealing;
                  const healthPercentage = hitPointsBeforeHeal / event.maxHitPoints;
                  //============
                  totalManaUsed += parser.modules.spellManaCost.getManaCost(event);
                  console.log("event.manaCost: " + event.manaCost);
                  const rejuvenation = parser.modules.abilityTracker.getAbility(SPELLS.REJUVENATION.id);
                  const wg = parser.modules.abilityTracker.getAbility(SPELLS.WILD_GROWTH.id);
                  const tranq = parser.modules.abilityTracker.getAbility(SPELLS.TRANQUILITY_HEAL.id);
                  const regrowth = parser.modules.abilityTracker.getAbility(SPELLS.REGROWTH.id);

                  rejuvenationHpm = (rejuvenation.healingEffective + rejuvenation.healingAbsorbed) / rejuvenation.manaUsed;
                  wgHpm = (wg.healingEffective + wg.healingAbsorbed) / wg.manaUsed;
                  tranqHpm = (tranq.healingEffective + tranq.healingAbsorbed) / tranq.manaUsed;
                  regrowthHpm = (regrowth.healingEffective + regrowth.healingAbsorbed) / regrowth.manaUsed;
                  //==================
                  if (healthPercentage > this.state.maxPlayerHealthPercentage) {
                    return false;
                  }
                  total += effectiveHealing;
                  count += 1;
                  if ((effectiveHealing / event.maxHitPoints) < this.state.minHealOfMaxHealthPercentage) {
                    return false;
                  }
                  bigHealCount += 1;
                  totalBigHealing += effectiveHealing;

                  const combatant = parser.modules.combatants.getEntity(event);
                  if (!combatant) {
                    console.error('Missing combatant for event:', event);
                    return null; // pet or something
                  }
                  const spec = SPECS[combatant.specId];
                  const specClassName = spec.className.replace(' ', '');

                  return (
                    <tr key={`${event.timestamp}${effectiveHealing}${hitPointsBeforeHeal}`}>
                      <td style={{ width: '5%' }}>
                        {formatDuration((event.timestamp - fightStart) / 1000)}
                      </td>
                      <td style={{ width: '25%' }}>
                        <SpellLink id={event.ability.guid}>
                          <Icon icon={event.ability.abilityIcon} alt={event.ability.abilityIcon} /> {event.ability.name}
                        </SpellLink>
                      </td>
                      <td style={{ width: '20%' }} className={specClassName}>
                        <img src={`/specs/${specClassName}-${spec.specName.replace(' ', '')}.jpg`} alt="Spec logo" />{' '}
                        {combatant.name}
                      </td>
                      <td style={{ width: 170, paddingRight: 5, textAlign: 'right' }}>
                        {formatNumber(effectiveHealing)} @{' '}
                        {healthPercentage < 0 ? (
                          <dfn data-tip="This number may be negative when the player had an absorb larger than his health pool.">
                            {formatPercentage(healthPercentage)}% health
                          </dfn>
                        ) : `${formatPercentage(healthPercentage)}% health`}
                      </td>
                      <td style={{ width: '35%' }}>
                        <div className="flex" style={{ background: 'rgba(255, 255, 255, 0.3)', border: '1px solid #000' }}>
                          <div
                            className={`flex-sub performance-bar ${specClassName}-bg`}
                            style={{ width: `${healthPercentage * 100}%` }}
                          />
                          <div
                            className={'flex-sub performance-bar Hunter-bg'}
                            style={{ width: `${effectiveHealing / event.maxHitPoints * 100}%`, opacity: 0.4 }}
                          />
                          <div className="flex-main" />
                        </div>
                      </td>
                    </tr>
                  );
                })
            }
            <tr>
              <td colSpan="7">
                Total Mana used: {formatNumber(totalManaUsed)}<br/>
                Rejuv HPM: {formatNumber(rejuvenationHpm)}<br/>
                WG HPM: {formatNumber(wgHpm)}<br/>
                Tranquility: {formatNumber(tranqHpm)}<br/>
                RG: {formatNumber(regrowthHpm)}<br/>
                Total healing done on targets below {(this.state.maxPlayerHealthPercentage * 100)}% health: {formatNumber(total)} (spread over {count} seperate heals).<br />
                Total healing done on targets below {(this.state.maxPlayerHealthPercentage * 100)}% health for more than {Math.round(this.state.minHealOfMaxHealthPercentage * 100)}% of target's max health: {formatNumber(totalBigHealing)} (spread over {bigHealCount} seperate heals).
              </td>
              <td style={{ width: '35%' }}>
                <div className="flex" style={{ background: 'rgba(255, 255, 255, 0.3)', border: '1px solid #000' }}>
                  <div
                    className={`flex-sub performance-bar Hunter-bg`}
                    style={{ width: `${rejuvenationHpm * 100}%` }}
                  />
                  <div
                    className={'flex-sub performance-bar Hunter-bg'}
                    style={{ width: `${wgHpm * 100}%`, opacity: 0.4 }}
                  />
                  <div className="flex-main" />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
}

export default HealingPerMana;
