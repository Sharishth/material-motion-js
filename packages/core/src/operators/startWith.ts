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

import {
  MotionObservable,
} from '../observables/proxies';

import {
  Constructor,
  ObservableWithFoundationalMotionOperators,
  ObservableWithMotionOperators,
  Observer,
} from '../types';

import {
  isDefined,
} from '../typeGuards';

export type StartWithArgs<T> = {
  value: T,
};

export interface MotionSeedable<T> {
  startWith(value: T): ObservableWithMotionOperators<T>;
  startWith(kwargs: StartWithArgs<T>): ObservableWithMotionOperators<T>;
}

export function withStartWith<T, S extends Constructor<ObservableWithFoundationalMotionOperators<T>>>(superclass: S): S & Constructor<MotionSeedable<T>> {
  return class extends superclass implements MotionSeedable<T> {
    /**
     * Emits `value` and passes through all subsequent values.
     *
     * Returns a remembered stream, so each new observer will synchronously
     * receive the most recent value.
     */
    startWith(value: T): ObservableWithMotionOperators<T>;
    startWith(kwargs: StartWithArgs<T>): ObservableWithMotionOperators<T>;
    startWith({ value }: StartWithArgs<T> & T): ObservableWithMotionOperators<T> {
      const hasValue = isDefined(value);
      // Only destructure if the supplied argument has the correct number of
      // members.
      if (!hasValue || (hasValue && Object.keys(arguments[0]).length > 1)) {
        value = arguments[0];
      }

      return new MotionObservable(
        (observer: Observer<T>) => {
          observer.next(value);
          const subscription = this.subscribe(observer);

          return subscription.unsubscribe;
        }
      )._remember();
    }
  };
}
