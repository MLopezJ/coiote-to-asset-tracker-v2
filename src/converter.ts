import {
	Device_3_urn,
	ConnectivityMonitoring_4_urn,
	Location_6_urn,
	Temperature_3303_urn,
	Humidity_3304_urn,
	Pressure_3323_urn,
} from '@nordicsemiconductor/lwm2m-types'
import type {
	Device_3,
	ConnectivityMonitoring_4,
	Location_6,
	Temperature_3303,
	Humidity_3304,
	Pressure_3323,
} from '@nordicsemiconductor/lwm2m-types'
import { type Config_50009, Config_50009_urn } from './schemas/Config_50009.js'
import { LwM2MFormatError } from './utils/checkLwM2MFormat.js'
import { convertToLwM2M } from './utils/convertToLwM2M.js'
import type { UndefinedCoioteObjectWarning } from './utils/UndefinedCoioteObjectWarning.js'
import { getDevice } from './utils/getDevice.js'
import { getTemperature } from './utils/getTemperature.js'
import { setTimestampHierarchy } from './setTimestampHierarchy.js'

export type Value = { value: string | number | boolean }
export type List = Record<string, { dim: string } | Value>
export type Resource = { [key: string]: Value | List }
type instanceId = string
export type Instance = Record<instanceId, Resource>
type objectId = string
export type LwM2MCoiote = Record<objectId, Instance>

export type DeviceTwin = {
	properties: {
		desired: unknown
		reported: {
			lwm2m: LwM2MCoiote
			$metadata: unknown
			$version: number
		}
	}
}

/**
 * Expected output format
 */
export type LwM2MAssetTrackerV2 = {
	[Device_3_urn]?: Device_3
	[ConnectivityMonitoring_4_urn]?: ConnectivityMonitoring_4
	[Location_6_urn]?: Location_6
	[Temperature_3303_urn]?: Temperature_3303
	[Humidity_3304_urn]?: Humidity_3304
	[Pressure_3323_urn]?: Pressure_3323
	[Config_50009_urn]?: Config_50009
}

/**
 * The id of the Asset Tracker v2 objects given by Coiote
 */
const coioteIds = {
	Device: 3,
	ConnectivityMonitoring: 4,
	Location: 6,
	Temperature: 3303,
	Humidity: 3304,
	Pressure: 3323,
	Config: 50009,
}

/**
 * Convert 'Coiote Asset Tracker v2' format into 'LwM2M Asset Tracker v2' format
 */
export const converter = async (
	deviceTwin: DeviceTwin,
	onWarning?: (element: UndefinedCoioteObjectWarning) => void,
	onError?: (element: LwM2MFormatError) => void,
): Promise<LwM2MAssetTrackerV2> => {
	const conversionResult = {} as LwM2MAssetTrackerV2
	const deviceTwinData = deviceTwin.properties.reported.lwm2m

	const device = getDevice(deviceTwinData[coioteIds.Device])

	const AssetTrackerV2LwM2MObjects = {
		[Device_3_urn]: device,
		[ConnectivityMonitoring_4_urn]: convertToLwM2M({
			LwM2MObjectUrn: ConnectivityMonitoring_4_urn as keyof LwM2MAssetTrackerV2,
			coioteObject: deviceTwinData[coioteIds.ConnectivityMonitoring],
		}),
		[Location_6_urn]: convertToLwM2M({
			LwM2MObjectUrn: Location_6_urn as keyof LwM2MAssetTrackerV2,
			coioteObject: deviceTwinData[coioteIds.Location],
		}),
		[Temperature_3303_urn]: getTemperature(
			deviceTwinData[coioteIds.Temperature],
		),
		[Humidity_3304_urn]: convertToLwM2M({
			LwM2MObjectUrn: Humidity_3304_urn as keyof LwM2MAssetTrackerV2,
			coioteObject: deviceTwinData[coioteIds.Humidity],
		}),
		[Pressure_3323_urn]: convertToLwM2M({
			LwM2MObjectUrn: Pressure_3323_urn as keyof LwM2MAssetTrackerV2,
			coioteObject: deviceTwinData[coioteIds.Pressure],
		}),
		[Config_50009_urn]: convertToLwM2M({
			LwM2MObjectUrn: Config_50009_urn as keyof LwM2MAssetTrackerV2,
			coioteObject: deviceTwinData[coioteIds.Config],
		}),
	}

	Object.entries(AssetTrackerV2LwM2MObjects).forEach(
		([objectURN, LwM2MObject]) => {
			if ('result' in LwM2MObject) {
				if (
					checkTimestampObjects.includes(objectURN) &&
					objectHasTimestampUndefined(
						LwM2MObject.result as
							| Temperature_3303
							| Humidity_3304
							| Pressure_3323,
					) === true
				) {
					const object = setTimestampHierarchy(
						LwM2MObject.result as
							| Temperature_3303
							| Humidity_3304
							| Pressure_3323,
						'result' in device ? device.result : undefined,
					)
					;(conversionResult as any)[objectURN] = object
				} else {
					;(conversionResult as any)[objectURN] = LwM2MObject.result // TODO: solve this any
				}
			} else {
				'warning' in LwM2MObject
					? onWarning?.(LwM2MObject.warning)
					: onError?.(LwM2MObject.error as any)
			}
		},
	)

	// TODO: set timestamp for Temperature, Humidity and Pressure

	return conversionResult
}

/**
 * List of object that need to check if timestamp value is undefined
 */
const checkTimestampObjects = [
	Temperature_3303_urn,
	Humidity_3304_urn,
	Pressure_3323_urn,
]

/**
 * Check if timestamp is undefined in object
 *
 * First instance of object is the default option to be selected
 * 5518 is the resource selected as timestamp
 */
const objectHasTimestampUndefined = (
	object: Temperature_3303 | Humidity_3304 | Pressure_3323,
) => object[0]?.[5518] === undefined
