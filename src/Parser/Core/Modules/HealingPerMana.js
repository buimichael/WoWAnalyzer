import React from 'react';

import Module from 'Parser/Core/Module';

import Tab from 'Main/Tab';
import HealingPerManaComponent from 'Main/HealingPerMana';

class HealingPerMana extends Module {
  tab() {
    return {
      title: 'Healing Per Mana',
      url: 'healing-per-mana',
      render: () => (
        <Tab title="Low health healing">
          <HealingPerManaComponent parser={this.owner} />
        </Tab>
      ),
    };
  }
}

export default HealingPerMana;
