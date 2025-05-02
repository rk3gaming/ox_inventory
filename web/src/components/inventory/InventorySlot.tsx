import React, { useCallback, useRef } from 'react';
import { DragSource, Inventory, InventoryType, Slot, SlotWithItem } from '../../typings';
import { useDrag, useDragDropManager, useDrop } from 'react-dnd';
import { useAppDispatch } from '../../store';
import WeightBar from '../utils/WeightBar';
import { onDrop } from '../../dnd/onDrop';
import { onBuy } from '../../dnd/onBuy';
import { Items } from '../../store/items';
import { canCraftItem, canPurchaseItem, getItemUrl, isSlotWithItem } from '../../helpers';
import { onUse } from '../../dnd/onUse';
import { Locale } from '../../store/locale';
import { onCraft } from '../../dnd/onCraft';
import useNuiEvent from '../../hooks/useNuiEvent';
import { ItemsPayload } from '../../reducers/refreshSlots';
import { closeTooltip, openTooltip } from '../../store/tooltip';
import { openContextMenu } from '../../store/contextMenu';
import { useMergeRefs } from '@floating-ui/react';

interface SlotProps {
  inventoryId: Inventory['id'];
  inventoryType: Inventory['type'];
  inventoryGroups: Inventory['groups'];
  item: Slot;
  hotbar?: boolean;
}

const InventorySlot: React.ForwardRefRenderFunction<HTMLDivElement, SlotProps> = (
  { item, inventoryId, inventoryType, inventoryGroups, hotbar },
  ref
) => {
  const manager = useDragDropManager();
  const dispatch = useAppDispatch();
  const timerRef = useRef<number | null>(null);

  const canDrag = useCallback(() => {
    return canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) && canCraftItem(item, inventoryType);
  }, [item, inventoryType, inventoryGroups]);

  const [{ isDragging }, drag] = useDrag<DragSource, void, { isDragging: boolean }>(
    () => ({
      type: 'SLOT',
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      item: () =>
        isSlotWithItem(item, inventoryType !== InventoryType.SHOP)
          ? {
              inventory: inventoryType,
              item: {
                name: item.name,
                slot: item.slot,
              },
              image: item?.name && `url(${getItemUrl(item) || 'none'}`,
            }
          : null,
      canDrag,
    }),
    [inventoryType, item]
  );

  const [{ isOver }, drop] = useDrop<DragSource, void, { isOver: boolean }>(
    () => ({
      accept: 'SLOT',
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
      drop: (source) => {
        dispatch(closeTooltip());
        switch (source.inventory) {
          case InventoryType.SHOP:
            onBuy(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
          case InventoryType.CRAFTING:
            onCraft(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
          default:
            onDrop(source, { inventory: inventoryType, item: { slot: item.slot } });
            break;
        }
      },
      canDrop: (source) =>
        (source.item.slot !== item.slot || source.inventory !== inventoryType) &&
        inventoryType !== InventoryType.SHOP &&
        inventoryType !== InventoryType.CRAFTING,
    }),
    [inventoryType, item]
  );

  useNuiEvent('refreshSlots', (data: { items?: ItemsPayload | ItemsPayload[] }) => {
    if (!isDragging && !data.items) return;
    if (!Array.isArray(data.items)) return;

    const itemSlot = data.items.find(
      (dataItem) => dataItem.item.slot === item.slot && dataItem.inventory === inventoryId
    );

    if (!itemSlot) return;

    manager.dispatch({ type: 'dnd-core/END_DRAG' });
  });

  const connectRef = (element: HTMLDivElement) => drag(drop(element));

  const handleContext = (event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (inventoryType !== 'player' || !isSlotWithItem(item)) return;
    dispatch(openTooltip({ item, inventoryType, coords: { x: event.clientX, y: event.clientY } }));
    dispatch(openContextMenu({ item }));

  };

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    dispatch(closeTooltip());
    if (timerRef.current) clearTimeout(timerRef.current);
    if (event.ctrlKey && isSlotWithItem(item) && inventoryType !== 'shop' && inventoryType !== 'crafting') {
      onDrop({ item: item, inventory: inventoryType });
    } else if (event.altKey && isSlotWithItem(item) && inventoryType === 'player') {
      onUse(item);
    }
  };

  const refs = useMergeRefs([connectRef, ref]);
  const [hovered, setHovered] = React.useState(false);
  if (inventoryType === 'player' && item.slot <= 5 && !hotbar) {
    return (<></>);
  } 

  return (
    <div
    ref={refs}
    onContextMenu={handleContext}
    onClick={handleClick}
    className="inventory-slot-wrapper"

    {...(isSlotWithItem(item) && { style: { 
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      borderRadius: '5px',
      border: '1px solid #FFF',
      background: 'radial-gradient(50% 50% at 50% 50%, rgba(68, 68, 68, 0.15) 0%, rgba(182, 182, 182, 0.15) 100%)',
      boxShadow: '0px 0px 25px 0px rgba(0, 0, 0, 0.15) inset',
     }})}

    onMouseOver={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
  >
    <div
      className="inventory-slot"
      style={{
        filter:
          !canPurchaseItem(item, { type: inventoryType, groups: inventoryGroups }) || !canCraftItem(item, inventoryType)
            ? 'brightness(80%) grayscale(100%)'
            : undefined,
        opacity: isDragging ? 0.4 : 1.0,
        backgroundImage: `url(${item?.name ? getItemUrl(item as SlotWithItem) : 'none'}`,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: '5px',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        backgroundColor: 'rgba(68, 68, 68, 0.15)',
        boxShadow: '0px 0px 25px 0px rgba(0, 0, 0, 0.15) inset',

      }}
    >
      {inventoryType === 'player' && item.slot <= 5 && <div className="inventory-slot-number">{item.slot}</div>}
      {isSlotWithItem(item) && (
        <div
          className="item-slot-wrapper"
        >
          <div
            className={
              inventoryType === 'player' && item.slot <= 5 ? 'item-hotslot-header-wrapper' : 'item-slot-header-wrapper'
            }
          >
            <div className="item-slot-info-wrapper">
              <p className='countText'>{item.count ? item.count.toLocaleString('en-us') + `` : ''}<p className='countEmb'>x</p></p>
              <div className='weightWrapper'>
                  <p className='weightText'>
                    {item.weight > 0
                      ? item.weight >= 1000
                        ? `${(item.weight / 1000).toLocaleString('en-us', {
                            minimumFractionDigits: 2,
                          })}`
                        : `${item.weight.toLocaleString('en-us', {
                            minimumFractionDigits: 0,
                          })}`
                      : ''}
                  </p>
                  {item.weight > 0 && (
                    <p className='countEmb'>
                      {item.weight >= 1000 ? 'kg' : 'g'}
                    </p>
                  )}
                </div>

              </div>
          </div>
          <div>
          {inventoryType === 'shop' && item?.price !== undefined && (
              <>
                {item?.currency !== 'money' && item.currency !== 'black_money' && item.price > 0 && item.currency ? (
                  <div className="item-slot-currency-wrapper">
                    <img
                      src={item.currency ? getItemUrl(item.currency) : 'none'}
                      alt="item-image"
                      style={{
                        imageRendering: '-webkit-optimize-contrast',
                        height: 'auto',
                        width: '2vh',
                        backfaceVisibility: 'hidden',
                        transform: 'translateZ(0)',
                      }}
                    />
                    <p>{item.price.toLocaleString('en-us')}</p>
                  </div>
                ) : (
                  <>
                    {item.price > 0 && (
                      <div
                        className="item-slot-price-wrapper"
                        style={{ color: item.currency === 'money' || !item.currency ? '#FFF' : '#FFF' }}
                      >
                        <p>
                          {Locale.$ || '$'}
                          {item.price.toLocaleString('en-us')}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
            {inventoryType !== 'shop' && item?.durability !== undefined && (
              <WeightBar percent={item.durability} durability />
            )}
              <div className="inventory-slot-label-text">
                {/* {item.metadata?.label ? item.metadata.label : Items[item.name]?.label || item.name} */}
              </div>
            
          </div>
        </div>
      )}
    </div>
  </div>
  );
};

export default React.memo(React.forwardRef(InventorySlot));
