import type { ReactNode } from 'react';
import {
  EmberCapeModel,
  FlameHaloModel,
  PixelWingsModel,
  GoldBadgeModel,
  NetherWingsModel,
  CrownOfFlamesModel,
} from '../components/ShopModels';

const ITEMS: { name: string; price: string; art: ReactNode }[] = [
  {
    name: 'Ember Cape',
    price: '500 Coins',
    art: <EmberCapeModel depth={3} delay={0} />,
  },
  {
    name: 'Flame Halo',
    price: '300 Coins',
    art: <FlameHaloModel depth={3} delay={0.4} />,
  },
  {
    name: 'Pixel Wings',
    price: '750 Coins',
    art: <PixelWingsModel depth={3} delay={0.8} />,
  },
  {
    name: 'Gold Badge',
    price: '250 Coins',
    art: <GoldBadgeModel depth={3} delay={1.6} />,
  },
  {
    name: 'Nether Wings',
    price: '900 Coins',
    art: <NetherWingsModel depth={3} delay={1.2} />,
  },
  {
    name: 'Crown of Flames',
    price: '1200 Coins',
    art: <CrownOfFlamesModel depth={3} delay={2} />,
  },
];

export default function ShopScreen() {
  return (
    <div className="screen">
      <div className="screen-head">
        <h1 className="screen-title">Shop</h1>
        <p className="screen-sub">
          Cosmetics and collectibles for your Flame Client profile
        </p>
      </div>

      <div className="shop-grid">
        {ITEMS.map((item) => (
          <div key={item.name} className="shop-card">
            <div className="shop-art">{item.art}</div>
            <div className="shop-name">{item.name}</div>
            <div className="shop-price">{item.price}</div>
            <button className="shop-buy">BUY</button>
          </div>
        ))}
      </div>
    </div>
  );
}
