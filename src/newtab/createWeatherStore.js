import { BehaviorSubject, combineLatest } from "rxjs"
import { take, map, distinctUntilChanged, filter } from "rxjs/operators"

import storageKeys from "../util/storageKeys"
import * as Settings from "../Settings"
import createStorageObservable from "../util/createStorageObservable"

export default function createWeatherStore() {
  const dataSubject = new BehaviorSubject(null)

  const dataObservable = createStorageObservable(
    "local",
    storageKeys.WEATHER_DATA
  ).pipe(
    map(data => (data && Date.now() < data.hardExpiration ? data : null)),
    distinctUntilChanged()
  )

  dataObservable.subscribe(dataSubject)

  combineLatest(Settings.onChanged(Settings.keys.SHOW_WEATHER), dataSubject)
    .pipe(
      filter(
        ([isVisible, data]) =>
          isVisible && (!data || data.freshExpiration < Date.now())
      ),
      take(1)
    )
    .subscribe(() => {
      chrome.runtime.getBackgroundPage(page => {
        page.fetchAndCacheWeatherData()
      })
    })

  return {
    dataSubject,
    cacheLoaded: dataObservable.pipe(take(1)).toPromise()
  }
}
