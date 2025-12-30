/**
 * iRacing SDK type definitions
 * Based on irsdk_defines.h from the iRacing SDK
 */

export const IRSDK_MAX_BUFS = 4;
export const IRSDK_MAX_STRING = 32;
export const IRSDK_MAX_DESC = 64;

/**
 * Variable types in the telemetry data
 */
export enum VarType {
	Char = 0,
	Bool = 1,
	Int = 2,
	BitField = 3,
	Float = 4,
	Double = 5
}

/**
 * Status flags from the header
 */
export enum StatusField {
	Connected = 1
}

/**
 * Variable header entry - describes a single telemetry variable
 */
export interface VarHeader {
	type: VarType;
	offset: number;
	count: number;
	countAsTime: boolean;
	name: string;
	desc: string;
	unit: string;
}

/**
 * Variable buffer - contains raw telemetry data
 */
export interface VarBuf {
	tickCount: number;
	bufOffset: number;
	padData: number[];
}

/**
 * Main iRacing SDK header structure
 */
export interface IRSDKHeader {
	ver: number;
	status: number;
	tickRate: number;
	sessionInfoUpdate: number;
	sessionInfoLen: number;
	sessionInfoOffset: number;
	numVars: number;
	varHeaderOffset: number;
	numBuf: number;
	bufLen: number;
	padData: number[];
	varBuf: VarBuf[];
}

/**
 * Parsed telemetry data
 */
export interface TelemetryData {
	[key: string]: number | boolean | string | number[];
}

/**
 * Session info (YAML data parsed to object)
 */
export interface SessionInfo {
	[key: string]: any;
}
