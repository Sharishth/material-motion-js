/** @license
 *  Copyright 2016 - present The Material Motion Authors. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License"); you may not
 *  use this file except in compliance with the License. You may obtain a copy
 *  of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 *  WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 *  License for the specific language governing permissions and limitations
 *  under the License.
 */

import * as React from 'react';

import { create as createJSS, StyleSheet } from 'jss';
import createDefaultJSSPreset from 'jss-preset-default';

import {
  Block,
  Col,
  Row,
} from 'jsxstyle';

import {
  Axis,
  Draggable,
  MotionProperty,
  NumericSpring,
  Point2DSpring,
  ThresholdRegion,
  Tossable,
  combineLatest,
  combineStyleStreams,
  createProperty,
  getPointerEventStreamsFromElement,
  subscribe,
} from 'material-motion';

const jss = createJSS(createDefaultJSSPreset());

// Stolen from mdc-web's CSS
const SHADOW = `
  0px 2px 1px -1px rgba(0, 0, 0, 0.2),
  0px 1px 1px 0px rgba(0, 0, 0, 0.14),
  0px 1px 3px 0px rgba(0, 0, 0, 0.12)
`;

const SPRING_INDICATOR_AREA_WIDTH = 200;

export class TossableDemo extends React.Component<{}, {}> {
  boxStyle$ = createProperty({ initialValue: {} });
  iconStyle$ = createProperty({ initialValue: {} });
  thresholdIndicatorStyle$ = createProperty({ initialValue: {} });
  springIndicatorStyle$ = createProperty({ initialValue: {} });

  styleSheet = jss.createStyleSheet(
    {
      box: this.boxStyle$,
      icon: this.iconStyle$,
      thresholdIndicator: this.thresholdIndicatorStyle$,
      springIndicator: this.springIndicatorStyle$,
    },
    {
      link: true,
    },
  ).attach();

  boxElement: HTMLElement;

  attachInteractions() {
    // This is a visual demonstration of a common pattern: triggering a spring
    // when a threshold is crossed.  In a real interaction, the spring could
    // drive the opacity of a preview state, for instance.
    //
    // This is not an example of a tossable interaction.  A tossable interaction
    // should use the velocity of the drag to determine whether or not to cross
    // the threshold, falling back to position only if the velocity isn't strong
    // enough to discern user intent.

    const pointerStreams = getPointerEventStreamsFromElement(this.boxElement);
    const draggable = new Draggable(pointerStreams);
    draggable.axis = Axis.Y;
    const boxSpring = new Point2DSpring();

    const tossable = new Tossable({ draggable, spring: boxSpring });
    const thresholdCrossedSpring = new NumericSpring();

    const threshold$ = createProperty({ initialValue: 200 });
    const isAboveThreshold$ = tossable.draggedLocation$.pluck('y').threshold(threshold$).isAnyOf([ ThresholdRegion.ABOVE ]);

    subscribe({
      sink: boxSpring.ySpring.destination$,
      source: isAboveThreshold$.rewrite({
        mapping: {
          false: 0,
          true: threshold$.multipliedBy(2),
        }
      }),
    });

    subscribe({
      sink: thresholdCrossedSpring.destination$,
      source: isAboveThreshold$.dedupe().rewrite({
        mapping: {
          true: 1,
          false: 0,
        },
      }),
    });

    subscribe({
      sink: this.boxStyle$,
      source: combineStyleStreams(tossable.styleStreams),
    });

    subscribe({
      sink: this.iconStyle$,
      source: combineStyleStreams({
        rotate$: thresholdCrossedSpring.value$.multipliedBy(Math.PI),
        transformOrigin$: {
          x: '50%',
          y: '50%',
        },
        willChange$: 'transform',
      }),
    });

    subscribe({
      sink: this.springIndicatorStyle$,
      source: combineStyleStreams({
        translate$: combineLatest({
          x: thresholdCrossedSpring.value$.multipliedBy(SPRING_INDICATOR_AREA_WIDTH),
          y: 0,
        }),
        willChange$: 'transform',
      }),
    });

    subscribe({
      sink: this.thresholdIndicatorStyle$,
      source: combineStyleStreams({
        translate$: combineLatest({
          x: 0,
          y: threshold$,
        }),
      }),
    });
  }

  attachBoxElement = (element: HTMLElement) => {
    this.boxElement = element;

    this.attachInteractions();
  }

  render() {
    const {
      classes,
    } = this.styleSheet;

    return (
      <Block
        minWidth = '100vw'
        minHeight = '100vh'
        backgroundColor = '#202020'
      >
        <Block
          position = 'relative'
          top = { 52 }
          left = { 52 }
        >
          <Block
            className = { classes.box }
            touchAction = 'none'
            userSelect = 'none'
            cursor = 'pointer'
            position = 'absolute'
            zIndex = { 1 }
            props = {
              {
                ref: this.attachBoxElement,
              }
            }
          >
            <Col
              position = 'absolute'
              top = { -36 }
              left = { -36 }
              width = { 72 }
              height = { 72 }
              borderRadius = { 2 }
              backgroundColor = '#FD82AB'
              boxShadow = { SHADOW }
              justifyContent = 'center'
              alignItems = 'center'
            >
              <img
                className = { classes.icon }
                src = 'https://www.gstatic.com/images/icons/material/system/svg/arrow_upward_48px.svg'
               />
            </Col>
          </Block>

          <Block
            className = { classes.thresholdIndicator }
            // This is a container.  The child node draws the line.
            position = 'absolute'
          >
            <Block
              position = 'absolute'
              backgroundColor = '#F01896'
              width = '200vw'
              left = '-100vw'
              height = { 2 }
            />

            <Col
              position = 'relative'
              left = { 52 }
            >
              <Row
                justifyContent = 'space-between'
                marginBottom = { 16 }
                width = { SPRING_INDICATOR_AREA_WIDTH }
                marginLeft = { 18 }
                position = 'absolute'
                bottom = { 10 }
              >
                <Label
                  width = '1em'
                  left = '-.5em'
                >
                  0
                </Label>
                <Label
                  width = '1em'
                  right = '-.5em'
                >
                  1
                </Label>
              </Row>

              <Block
                className = { classes.springIndicator }
                backgroundColor = '#00D6D6'
                position = 'absolute'
                top = { -18 }
                width = { 36 }
                height = { 36 }
                borderRadius = { 18 }
                boxShadow = { SHADOW }
              />
            </Col>
          </Block>
        </Block>
      </Block>
    );
  }
}
export default TossableDemo;


function Label({ children, ...propsPassthrough }) {
  return (
    <Block
      fontSize = { 16 }
      color = '#FFFFFF'
      fontFamily = 'Roboto Mono'
      position = 'relative'
      textAlign = 'center'
      { ...propsPassthrough }
    >
      { children }
    </Block>
  );
}
