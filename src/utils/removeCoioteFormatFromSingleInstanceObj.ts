import type {
	List,
	Value,
	Instance as coioteInstance,
} from '../utils/LwM2MCoioteType.js'
import {
	type Device_3,
	type ConnectivityMonitoring_4,
	type Location_6,
	type Config_50009,
} from '../schemas/index.js'

/**
 * Single Instances objects in Assset Tracker v2
 */
type SingleInstancesObjs =
	| Device_3
	| ConnectivityMonitoring_4
	| Location_6
	| Config_50009

/**
 *  Remove coiote format from single instance object following schema definition
 */
export const removeCoioteFormatFromSingleInstanceObj = (
	input: coioteInstance,
): SingleInstancesObjs => {
	const resources = input['0'] ?? []
	const instance = Object.entries(resources)
		.map(([resourceId, value]) => {
			const newFormat = removeKeyFromResource(value)
			return {
				[`${resourceId}`]: newFormat,
			}
		})
		.reduce(
			(previous: Record<string, unknown>, current) => ({
				...current,
				...previous,
			}),
			{},
		)
	return instance as SingleInstancesObjs
}

/**
 * Remove the key 'value' from input
 */
export const removeKeyFromResource = (resource: Value | List): unknown => {
	if ((resource as List).attributes !== undefined) {
		return Object.values(resource)
			.filter((element) => {
				if (element.dim === undefined) {
					return element
				}
			})
			.map((element) => element.value)
	}

	return resource.value
}
