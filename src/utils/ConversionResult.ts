import type { UndefinedCoioteObjectWarning } from './UndefinedCoioteObjectWarning.js'
import type { ValidationError } from './ValidationError.js'

/**
 * Result type interface of 'src/assetTrackerV2Objects' methods
 */
export type ConversionResult<Result> =
	| { result: Result }
	| { error: ValidationError | UndefinedCoioteObjectWarning }
