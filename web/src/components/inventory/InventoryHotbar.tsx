import React, { useState } from 'react';
import { getItemUrl, isSlotWithItem } from '../../helpers';
import useNuiEvent from '../../hooks/useNuiEvent';
import { Items } from '../../store/items';
import WeightBar from '../utils/WeightBar';
import { useAppSelector } from '../../store';
import { selectLeftInventory } from '../../store/inventory';
import { SlotWithItem } from '../../typings';
import SlideUp from '../utils/transitions/SlideUp';

const InventoryHotbar: React.FC = () => {
  const [hotbarVisible, setHotbarVisible] = useState(false);
  const items = useAppSelector(selectLeftInventory).items.slice(0, 5);

  //stupid fix for timeout
  const [handle, setHandle] = useState<NodeJS.Timeout>();
  useNuiEvent('toggleHotbar', () => {
    if (hotbarVisible) {
      setHotbarVisible(false);
    } else {
      if (handle) clearTimeout(handle);
      setHotbarVisible(true);
      setHandle(setTimeout(() => setHotbarVisible(false), 3000));
    }
  });

  return (
    <SlideUp in={hotbarVisible}>
      <div className="hotbar-container">
        {items.map((item) => (
          <div
            className="inventory-slot-wrapper"

            {...(isSlotWithItem(item) && {
              style: {
                backgroundColor: 'rgba(213, 213, 213, 0.05)',
                border: '1px solid rgba(163, 166, 168, 0.12)',
                borderRadius: '.4167vw',
              }
            })}
          >
            <div
              className="hotbar-item-slot"
              style={{
                backgroundImage: `url(${item?.name ? getItemUrl(item as SlotWithItem) : 'none'}`,
                backgroundColor: 'rgba(213, 213, 213, 0.05)',
                border: '1px solid rgba(163, 166, 168, 0.12)',
                borderRadius: '.4167vw',
              }}
              key={`hotbar-${item.slot}`}
            >
              {!isSlotWithItem(item) && (
                <div className="item-slot-wrapper hotbar-slot-wrapper">
                <div className="inventory-slot-number">{item.slot}</div>
                  <div className="item-slot-info-wrapper hotbar-slot-info">
                    {/* <p>{item.count ? item.count.toLocaleString('en-us') + `x` : ''}</p> */}
                  </div>
              </div>
              )}
              {isSlotWithItem(item) && (
                <div className="item-slot-wrapper hotbar-slot-wrapper">
                  <div className="inventory-slot-number">{item.slot}</div>
                    <div className="item-slot-info-wrapper hotbar-slot-info">
                      {/* <p>{item.count ? item.count.toLocaleString('en-us') + `x` : ''}</p> */}
                    </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </SlideUp>
  );
};

export default InventoryHotbar;
