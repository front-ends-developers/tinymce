import { FieldSchema } from '@ephox/boulder';
import { ClientRect, HTMLElement } from '@ephox/dom-globals';
import { Cell, Fun, Option, Arr } from '@ephox/katamari';
import { PlatformDetection } from '@ephox/sand';

import { SugarEvent } from '../../alien/TypeDefinitions';
import * as Behaviour from '../../api/behaviour/Behaviour';
import { Focusing } from '../../api/behaviour/Focusing';
import { Keying } from '../../api/behaviour/Keying';
import { AlloyComponent } from '../../api/component/ComponentApi';
import * as AlloyEvents from '../../api/events/AlloyEvents';
import * as NativeEvents from '../../api/events/NativeEvents';
import { NativeSimulatedEvent } from '../../events/SimulatedEvent';
import * as PartType from '../../parts/PartType';
import { SliderDetail } from '../../ui/types/SliderTypes';
import * as SliderActions from './SliderActions';
import { horizontal } from 'ephox/alloy/navigation/DomNavigation';

const platform = PlatformDetection.detect();
const isTouch = platform.deviceType.isTouch();

const edgePart = (name: string, action: (comp: AlloyComponent, d: SliderDetail) => void) => {
  return PartType.optional({
    name: '' + name + '-edge',
    overrides (detail: SliderDetail) {
      const touchEvents = AlloyEvents.derive([
        AlloyEvents.runActionExtra(NativeEvents.touchstart(), action, [ detail ])
      ]);

      const mouseEvents = AlloyEvents.derive([
        AlloyEvents.runActionExtra(NativeEvents.mousedown(), action, [ detail ]),
        AlloyEvents.runActionExtra(NativeEvents.mousemove(), (l, det) => {
          if (det.mouseIsDown().get()) { action (l, det); }
        }, [ detail ])
      ]);

      return {
        events: isTouch ? touchEvents : mouseEvents
      };
    }
  });
};

// When the user touches the left edge, it should move the thumb
const ledgePart = edgePart('left', SliderActions.setToLedge);

// When the user touches the right edge, it should move the thumb
const redgePart = edgePart('right', SliderActions.setToRedge);

// When the user touches the top edge, it should move the thumb
const tedgePart = edgePart('top', SliderActions.setToTedge);

// When the user touches the right edge, it should move the thumb
const bedgePart = edgePart('bottom', SliderActions.setToBedge);

// When the user touches the top left edge, it should move the thumb
const tlEdgePart = edgePart('top-left', SliderActions.setToTLedge);

// When the user touches the top right edge, it should move the thumb
const trEdgePart = edgePart('top-right', SliderActions.setToTRedge);

// When the user touches the bottom left edge, it should move the thumb
const blEdgePart = edgePart('bottom-left', SliderActions.setToBLedge);

// When the user touches the bottom right edge, it should move the thumb
const brEdgePart = edgePart('bottom-right', SliderActions.setToBRedge);

// The thumb part needs to have position absolute to be positioned correctly
const thumbPart = PartType.required({
  name: 'thumb',
  defaults: Fun.constant({
    dom: {
      styles: { position: 'absolute' }
    }
  }),
  overrides (detail: SliderDetail) {
    return {
      events: AlloyEvents.derive([
        // If the user touches the thumb itself, pretend they touched the spectrum instead. This
        // allows sliding even when they touchstart the current value
        AlloyEvents.redirectToPart(NativeEvents.touchstart(), detail, 'spectrum'),
        AlloyEvents.redirectToPart(NativeEvents.touchmove(), detail, 'spectrum'),
        AlloyEvents.redirectToPart(NativeEvents.touchend(), detail, 'spectrum'),

        AlloyEvents.redirectToPart(NativeEvents.mousedown(), detail, 'spectrum'),
        AlloyEvents.redirectToPart(NativeEvents.mousemove(), detail, 'spectrum'),
        AlloyEvents.redirectToPart(NativeEvents.mouseup(), detail, 'spectrum')
      ])
    };
  }
});

const spectrumPart = PartType.required({
  schema: [
    FieldSchema.state('mouseIsDown', () => Cell(false))
  ],
  name: 'spectrum',
  overrides (detail: SliderDetail) {
    const isH = detail.isHorizontal();
    const isV = detail.isVertical();
    const is2D = detail.isTwoD();

    const moveToX = (spectrum: AlloyComponent, simulatedEvent: NativeSimulatedEvent) => {
      SliderActions.setXFromEvent(spectrum, detail, simulatedEvent);
    };

    const moveToY = (spectrum: AlloyComponent, simulatedEvent: NativeSimulatedEvent) => {
      SliderActions.setYFromEvent(spectrum, detail, simulatedEvent);
    };

    const moveToCoords = function (spectrum: AlloyComponent, simulatedEvent: NativeSimulatedEvent) {
      SliderActions.setCoordsFromEvent(spectrum, detail, simulatedEvent);
    };

    // If the axes array contains neither horizontal or vertical, then no movement.
    var moveTo = Fun.noop;

    if (is2D) {
      moveTo = moveToCoords
    } else if (isH) {
      moveTo = moveToX
    } else if (isV) {
      moveTo = moveToY
    }

    const touchEvents = AlloyEvents.derive([
      AlloyEvents.run(NativeEvents.touchstart(), moveTo),
      AlloyEvents.run(NativeEvents.touchmove(), moveTo)
    ]);

    const mouseEvents = AlloyEvents.derive([
      AlloyEvents.run(NativeEvents.mousedown(), moveTo),
      AlloyEvents.run<SugarEvent>(NativeEvents.mousemove(), (spectrum, se) => {
        if (detail.mouseIsDown().get()) { moveTo(spectrum, se); }
      })
    ]);

    return {
      behaviours: Behaviour.derive(isTouch ? [ ] : [
        // Move left and right along the spectrum
        Keying.config({
          mode: 'special',
          onLeft (spectrum) {
            if (isH) {
              SliderActions.moveLeft(spectrum, detail);
              return Option.some(true);
            } else {
              return Option.none();
            }
          },
          onRight (spectrum) {
            if (isH) {
              SliderActions.moveRight(spectrum, detail);
              return Option.some(true);
            } else {
              return Option.none();
            }
          },
          onDown (spectrum) {
            if (isV) {
              SliderActions.moveDown(spectrum, detail);
              return Option.some(true);
            } else {
              return Option.none();
            }
          },
          onUp (spectrum) {
            if (isV) {
              SliderActions.moveUp(spectrum, detail);
              return Option.some(true);
            } else {
              return Option.none();
            }
          }
        }),
        Focusing.config({ })
      ]),

      events: isTouch ? touchEvents : mouseEvents
    };
  }
});

export default [
  ledgePart,
  redgePart,
  tedgePart,
  bedgePart,
  tlEdgePart,
  trEdgePart,
  blEdgePart,
  brEdgePart,
  thumbPart,
  spectrumPart
] as PartType.PartTypeAdt[];