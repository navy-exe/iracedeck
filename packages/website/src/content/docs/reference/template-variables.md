---
title: Template Variables
description: iRacing telemetry template variables available for the Telemetry Display action's Mustache templates.
---

These are the variables available for use in the Telemetry Display action's Mustache templates. Use them with the `{{variable}}` syntax to display live iRacing data on your Stream Deck buttons.

## Driver Info

Available prefixes: `self`, `track_ahead`, `track_behind`, `race_ahead`, `race_behind`

Examples shown with `self` prefix. Replace with any prefix above.

| Variable | Description |
|----------|-------------|
| `{{self.name}}` | Full driver name |
| `{{self.first_name}}` | First name |
| `{{self.last_name}}` | Last name |
| `{{self.abbrev_name}}` | Abbreviated name (e.g., "J. Smith") |
| `{{self.car_number}}` | Car number |
| `{{self.position}}` | Overall race position |
| `{{self.class_position}}` | Class position |
| `{{self.lap}}` | Current lap number |
| `{{self.laps_completed}}` | Laps completed |
| `{{self.irating}}` | iRating |
| `{{self.license}}` | License string (e.g., "A 4.99") |
| `{{self.incidents}}` | Incident count (self only) |

## Session

| Variable | Description |
|----------|-------------|
| `{{session.type}}` | Session type (Practice, Qualify, Race, etc.) |
| `{{session.laps_remaining}}` | Laps remaining |
| `{{session.time_remaining}}` | Time remaining (MM:SS) |

## Track

| Variable | Description |
|----------|-------------|
| `{{track.name}}` | Full track name |
| `{{track.short_name}}` | Short track name |

## Telemetry

All iRacing telemetry variables (excluding per-car arrays and high-frequency samples).

| Variable | Description |
|----------|-------------|
| `{{telemetry.SessionTime}}` | Seconds since session start (s) |
| `{{telemetry.SessionTick}}` | Current update number |
| `{{telemetry.SessionNum}}` | Session number |
| `{{telemetry.SessionState}}` | Session state (irsdk_SessionState) |
| `{{telemetry.SessionUniqueID}}` | Session ID |
| `{{telemetry.SessionFlags}}` | Session flags (irsdk_Flags) |
| `{{telemetry.SessionTimeRemain}}` | Seconds left till session ends (s) |
| `{{telemetry.SessionLapsRemain}}` | Old laps left till session ends use SessionLapsRemainEx |
| `{{telemetry.SessionLapsRemainEx}}` | New improved laps left till session ends |
| `{{telemetry.SessionTimeTotal}}` | Total number of seconds in session (s) |
| `{{telemetry.SessionLapsTotal}}` | Total number of laps in session |
| `{{telemetry.SessionJokerLapsRemain}}` | Joker laps remaining to be taken |
| `{{telemetry.SessionOnJokerLap}}` | Player is currently completing a joker lap |
| `{{telemetry.SessionTimeOfDay}}` | Time of day in seconds (s) |
| `{{telemetry.RadioTransmitCarIdx}}` | The car index of the current person speaking on the radio |
| `{{telemetry.RadioTransmitRadioIdx}}` | The radio index of the current person speaking on the radio |
| `{{telemetry.RadioTransmitFrequencyIdx}}` | The frequency index of the current person speaking on the radio |
| `{{telemetry.DisplayUnits}}` | Default units for the user interface 0 = english 1 = metric |
| `{{telemetry.DriverMarker}}` | Driver activated flag |
| `{{telemetry.PushToTalk}}` | Push to talk button state |
| `{{telemetry.PushToPass}}` | Push to pass button state |
| `{{telemetry.ManualBoost}}` | Hybrid manual boost state |
| `{{telemetry.ManualNoBoost}}` | Hybrid manual no boost state |
| `{{telemetry.IsOnTrack}}` | 1=Car on track physics running with player in car |
| `{{telemetry.IsReplayPlaying}}` | 0=replay not playing 1=replay playing |
| `{{telemetry.ReplayFrameNum}}` | Integer replay frame number (60 per second) |
| `{{telemetry.ReplayFrameNumEnd}}` | Integer replay frame number from end of tape |
| `{{telemetry.IsDiskLoggingEnabled}}` | 0=disk based telemetry turned off 1=turned on |
| `{{telemetry.IsDiskLoggingActive}}` | 0=disk based telemetry file not being written 1=being written |
| `{{telemetry.FrameRate}}` | Average frames per second (fps) |
| `{{telemetry.CpuUsageFG}}` | Percent of available time fg thread took with a 1 sec avg (%) |
| `{{telemetry.GpuUsage}}` | Percent of available time gpu took with a 1 sec avg (%) |
| `{{telemetry.ChanAvgLatency}}` | Communications average latency (s) |
| `{{telemetry.ChanLatency}}` | Communications latency (s) |
| `{{telemetry.ChanQuality}}` | Communications quality (%) |
| `{{telemetry.ChanPartnerQuality}}` | Partner communications quality (%) |
| `{{telemetry.CpuUsageBG}}` | Percent of available time bg thread took with a 1 sec avg (%) |
| `{{telemetry.ChanClockSkew}}` | Communications server clock skew (s) |
| `{{telemetry.MemPageFaultSec}}` | Memory page faults per second |
| `{{telemetry.MemSoftPageFaultSec}}` | Memory soft page faults per second |
| `{{telemetry.PlayerCarPosition}}` | Players position in race |
| `{{telemetry.PlayerCarClassPosition}}` | Players class position in race |
| `{{telemetry.PlayerCarClass}}` | Player car class id |
| `{{telemetry.PlayerTrackSurface}}` | Players car track surface type (irsdk_TrkLoc) |
| `{{telemetry.PlayerTrackSurfaceMaterial}}` | Players car track surface material type (irsdk_TrkSurf) |
| `{{telemetry.PlayerCarIdx}}` | Players carIdx |
| `{{telemetry.PlayerCarTeamIncidentCount}}` | Players team incident count for this session |
| `{{telemetry.PlayerCarMyIncidentCount}}` | Players own incident count for this session |
| `{{telemetry.PlayerCarDriverIncidentCount}}` | Teams current drivers incident count for this session |
| `{{telemetry.PlayerCarWeightPenalty}}` | Players weight penalty (kg) |
| `{{telemetry.PlayerCarPowerAdjust}}` | Players power adjust (%) |
| `{{telemetry.PlayerCarDryTireSetLimit}}` | Players dry tire set limit |
| `{{telemetry.PlayerCarTowTime}}` | Players car is being towed if time is greater than zero (s) |
| `{{telemetry.PlayerCarInPitStall}}` | Players car is properly in their pitstall |
| `{{telemetry.PlayerCarPitSvStatus}}` | Players car pit service status bits (irsdk_PitSvStatus) |
| `{{telemetry.PlayerTireCompound}}` | Players car current tire compound |
| `{{telemetry.PlayerFastRepairsUsed}}` | Players car number of fast repairs used |
| `{{telemetry.PaceMode}}` | Are we pacing or not (irsdk_PaceMode) |
| `{{telemetry.OnPitRoad}}` | Is the player car on pit road between the cones |
| `{{telemetry.SteeringWheelAngle}}` | Steering wheel angle (rad) |
| `{{telemetry.Throttle}}` | 0=off throttle to 1=full throttle (%) |
| `{{telemetry.Brake}}` | 0=brake released to 1=max pedal force (%) |
| `{{telemetry.Clutch}}` | 0=disengaged to 1=fully engaged (%) |
| `{{telemetry.Gear}}` | -1=reverse 0=neutral 1..n=current gear |
| `{{telemetry.RPM}}` | Engine rpm (revs/min) |
| `{{telemetry.PlayerCarSLFirstRPM}}` | Shift light first light rpm (revs/min) |
| `{{telemetry.PlayerCarSLShiftRPM}}` | Shift light shift rpm (revs/min) |
| `{{telemetry.PlayerCarSLLastRPM}}` | Shift light last light rpm (revs/min) |
| `{{telemetry.PlayerCarSLBlinkRPM}}` | Shift light blink rpm (revs/min) |
| `{{telemetry.Lap}}` | Laps started count |
| `{{telemetry.LapCompleted}}` | Laps completed count |
| `{{telemetry.LapDist}}` | Meters traveled from S/F this lap (m) |
| `{{telemetry.LapDistPct}}` | Percentage distance around lap (%) |
| `{{telemetry.RaceLaps}}` | Laps completed in race |
| `{{telemetry.CarDistAhead}}` | Distance to first car in front of player in meters (m) |
| `{{telemetry.CarDistBehind}}` | Distance to first car behind player in meters (m) |
| `{{telemetry.LapBestLap}}` | Players best lap number |
| `{{telemetry.LapBestLapTime}}` | Players best lap time (s) |
| `{{telemetry.LapLastLapTime}}` | Players last lap time (s) |
| `{{telemetry.LapCurrentLapTime}}` | Estimate of players current lap time as shown in F3 box (s) |
| `{{telemetry.LapLasNLapSeq}}` | Player num consecutive clean laps completed for N average |
| `{{telemetry.LapLastNLapTime}}` | Player last N average lap time (s) |
| `{{telemetry.LapBestNLapLap}}` | Player last lap in best N average lap time |
| `{{telemetry.LapBestNLapTime}}` | Player best N average lap time (s) |
| `{{telemetry.LapDeltaToBestLap}}` | Delta time for best lap (s) |
| `{{telemetry.LapDeltaToBestLap_DD}}` | Rate of change of delta time for best lap (s/s) |
| `{{telemetry.LapDeltaToBestLap_OK}}` | Delta time for best lap is valid |
| `{{telemetry.LapDeltaToOptimalLap}}` | Delta time for optimal lap (s) |
| `{{telemetry.LapDeltaToOptimalLap_DD}}` | Rate of change of delta time for optimal lap (s/s) |
| `{{telemetry.LapDeltaToOptimalLap_OK}}` | Delta time for optimal lap is valid |
| `{{telemetry.LapDeltaToSessionBestLap}}` | Delta time for session best lap (s) |
| `{{telemetry.LapDeltaToSessionBestLap_DD}}` | Rate of change of delta time for session best lap (s/s) |
| `{{telemetry.LapDeltaToSessionBestLap_OK}}` | Delta time for session best lap is valid |
| `{{telemetry.LapDeltaToSessionOptimalLap}}` | Delta time for session optimal lap (s) |
| `{{telemetry.LapDeltaToSessionOptimalLap_DD}}` | Rate of change of delta time for session optimal lap (s/s) |
| `{{telemetry.LapDeltaToSessionOptimalLap_OK}}` | Delta time for session optimal lap is valid |
| `{{telemetry.LapDeltaToSessionLastlLap}}` | Delta time for session last lap (s) |
| `{{telemetry.LapDeltaToSessionLastlLap_DD}}` | Rate of change of delta time for session last lap (s/s) |
| `{{telemetry.LapDeltaToSessionLastlLap_OK}}` | Delta time for session last lap is valid |
| `{{telemetry.Speed}}` | GPS vehicle speed (m/s) |
| `{{telemetry.Yaw}}` | Yaw orientation (rad) |
| `{{telemetry.YawNorth}}` | Yaw orientation relative to north (rad) |
| `{{telemetry.Pitch}}` | Pitch orientation (rad) |
| `{{telemetry.Roll}}` | Roll orientation (rad) |
| `{{telemetry.EnterExitReset}}` | Indicate action the reset key will take 0 enter 1 exit 2 reset |
| `{{telemetry.TrackTemp}}` | Deprecated set to TrackTempCrew (C) |
| `{{telemetry.TrackTempCrew}}` | Temperature of track measured by crew around track (C) |
| `{{telemetry.AirTemp}}` | Temperature of air at start/finish line (C) |
| `{{telemetry.TrackWetness}}` | How wet is the average track surface (irsdk_TrackWetness) |
| `{{telemetry.Skies}}` | Skies (0=clear/1=p cloudy/2=m cloudy/3=overcast) |
| `{{telemetry.AirDensity}}` | Density of air at start/finish line (kg/m^3) |
| `{{telemetry.AirPressure}}` | Pressure of air at start/finish line (Pa) |
| `{{telemetry.WindVel}}` | Wind velocity at start/finish line (m/s) |
| `{{telemetry.WindDir}}` | Wind direction at start/finish line (rad) |
| `{{telemetry.RelativeHumidity}}` | Relative Humidity at start/finish line (%) |
| `{{telemetry.FogLevel}}` | Fog level at start/finish line (%) |
| `{{telemetry.Precipitation}}` | Precipitation at start/finish line (%) |
| `{{telemetry.SolarAltitude}}` | Sun angle above horizon in radians (rad) |
| `{{telemetry.SolarAzimuth}}` | Sun angle clockwise from north in radians (rad) |
| `{{telemetry.WeatherDeclaredWet}}` | The steward says rain tires can be used |
| `{{telemetry.SteeringFFBEnabled}}` | Force feedback is enabled |
| `{{telemetry.DCLapStatus}}` | Status of driver change lap requirements |
| `{{telemetry.DCDriversSoFar}}` | Number of team drivers who have run a stint |
| `{{telemetry.OkToReloadTextures}}` | True if it is ok to reload car textures at this time |
| `{{telemetry.LoadNumTextures}}` | True if the car_num texture will be loaded |
| `{{telemetry.CarLeftRight}}` | Notify if car is to the left or right of driver (irsdk_CarLeftRight) |
| `{{telemetry.PitsOpen}}` | True if pit stop is allowed for the current player |
| `{{telemetry.VidCapEnabled}}` | True if video capture system is enabled |
| `{{telemetry.VidCapActive}}` | True if video currently being captured |
| `{{telemetry.PlayerIncidents}}` | Log incidents that the player received (irsdk_IncidentFlags) |
| `{{telemetry.PitRepairLeft}}` | Time left for mandatory pit repairs if repairs are active (s) |
| `{{telemetry.PitOptRepairLeft}}` | Time left for optional repairs if repairs are active (s) |
| `{{telemetry.PitstopActive}}` | Is the player getting pit stop service |
| `{{telemetry.FastRepairUsed}}` | How many fast repairs used so far |
| `{{telemetry.FastRepairAvailable}}` | How many fast repairs left 255 is unlimited |
| `{{telemetry.LFTiresUsed}}` | How many left front tires used so far |
| `{{telemetry.RFTiresUsed}}` | How many right front tires used so far |
| `{{telemetry.LRTiresUsed}}` | How many left rear tires used so far |
| `{{telemetry.RRTiresUsed}}` | How many right rear tires used so far |
| `{{telemetry.LeftTireSetsUsed}}` | How many left tire sets used so far |
| `{{telemetry.RightTireSetsUsed}}` | How many right tire sets used so far |
| `{{telemetry.FrontTireSetsUsed}}` | How many front tire sets used so far |
| `{{telemetry.RearTireSetsUsed}}` | How many rear tire sets used so far |
| `{{telemetry.TireSetsUsed}}` | How many tire sets used so far |
| `{{telemetry.LFTiresAvailable}}` | How many left front tires are remaining 255 is unlimited |
| `{{telemetry.RFTiresAvailable}}` | How many right front tires are remaining 255 is unlimited |
| `{{telemetry.LRTiresAvailable}}` | How many left rear tires are remaining 255 is unlimited |
| `{{telemetry.RRTiresAvailable}}` | How many right rear tires are remaining 255 is unlimited |
| `{{telemetry.LeftTireSetsAvailable}}` | How many left tire sets are remaining 255 is unlimited |
| `{{telemetry.RightTireSetsAvailable}}` | How many right tire sets are remaining 255 is unlimited |
| `{{telemetry.FrontTireSetsAvailable}}` | How many front tire sets are remaining 255 is unlimited |
| `{{telemetry.RearTireSetsAvailable}}` | How many rear tire sets are remaining 255 is unlimited |
| `{{telemetry.TireSetsAvailable}}` | How many tire sets are remaining 255 is unlimited |
| `{{telemetry.CamCarIdx}}` | Active camera's focus car index |
| `{{telemetry.CamCameraNumber}}` | Active camera number |
| `{{telemetry.CamGroupNumber}}` | Active camera group number |
| `{{telemetry.CamCameraState}}` | State of camera system (irsdk_CameraState) |
| `{{telemetry.IsOnTrackCar}}` | 1=Car on track physics running |
| `{{telemetry.IsInGarage}}` | 1=Car in garage physics running |
| `{{telemetry.SteeringWheelAngleMax}}` | Steering wheel max angle (rad) |
| `{{telemetry.ShiftPowerPct}}` | Friction torque applied to gears when shifting or grinding (%) |
| `{{telemetry.ShiftGrindRPM}}` | RPM of shifter grinding noise (RPM) |
| `{{telemetry.ThrottleRaw}}` | Raw throttle input 0=off throttle to 1=full throttle (%) |
| `{{telemetry.BrakeRaw}}` | Raw brake input 0=brake released to 1=max pedal force (%) |
| `{{telemetry.ClutchRaw}}` | Raw clutch input 0=disengaged to 1=fully engaged (%) |
| `{{telemetry.HandbrakeRaw}}` | Raw handbrake input 0=handbrake released to 1=max force (%) |
| `{{telemetry.BrakeABSactive}}` | true if abs is currently reducing brake force pressure |
| `{{telemetry.Shifter}}` | Log inputs from the players shifter control |
| `{{telemetry.EngineWarnings}}` | Bitfield for warning lights (irsdk_EngineWarnings) |
| `{{telemetry.FuelLevelPct}}` | Percent fuel remaining (%) |
| `{{telemetry.PitSvFlags}}` | Bitfield of pit service checkboxes (irsdk_PitSvFlags) |
| `{{telemetry.PitSvLFP}}` | Pit service left front tire pressure (kPa) |
| `{{telemetry.PitSvRFP}}` | Pit service right front tire pressure (kPa) |
| `{{telemetry.PitSvLRP}}` | Pit service left rear tire pressure (kPa) |
| `{{telemetry.PitSvRRP}}` | Pit service right rear tire pressure (kPa) |
| `{{telemetry.PitSvFuel}}` | Pit service fuel add amount (l or kWh) |
| `{{telemetry.PitSvTireCompound}}` | Pit service pending tire compound |
| `{{telemetry.P2P_Status}}` | Push2Pass active or not on your car |
| `{{telemetry.P2P_Count}}` | Push2Pass count of usage (or remaining in Race) on your car |
| `{{telemetry.SteeringWheelPctTorque}}` | Force feedback % max torque on steering shaft unsigned (%) |
| `{{telemetry.SteeringWheelPctTorqueSign}}` | Force feedback % max torque on steering shaft signed (%) |
| `{{telemetry.SteeringWheelPctTorqueSignStops}}` | Force feedback % max torque on steering shaft signed stops (%) |
| `{{telemetry.SteeringWheelPctIntensity}}` | Force feedback % max intensity (%) |
| `{{telemetry.SteeringWheelPctSmoothing}}` | Force feedback % max smoothing (%) |
| `{{telemetry.SteeringWheelPctDamper}}` | Force feedback % max damping (%) |
| `{{telemetry.SteeringWheelLimiter}}` | Force feedback limiter strength limits impacts and oscillation (%) |
| `{{telemetry.SteeringWheelMaxForceNm}}` | Value of strength or max force slider in Nm for FFB (N*m) |
| `{{telemetry.SteeringWheelPeakForceNm}}` | Peak torque mapping to direct input units for FFB (N*m) |
| `{{telemetry.SteeringWheelUseLinear}}` | True if steering wheel force is using linear mode |
| `{{telemetry.ShiftIndicatorPct}}` | DEPRECATED use DriverCarSLBlinkRPM instead (%) |
| `{{telemetry.IsGarageVisible}}` | 1=Garage screen is visible |
| `{{telemetry.ReplayPlaySpeed}}` | Replay playback speed |
| `{{telemetry.ReplayPlaySlowMotion}}` | 0=not slow motion 1=replay is in slow motion |
| `{{telemetry.ReplaySessionTime}}` | Seconds since replay session start (s) |
| `{{telemetry.ReplaySessionNum}}` | Replay session number |
| `{{telemetry.TireLF_RumblePitch}}` | Players LF Tire Sound rumblestrip pitch (Hz) |
| `{{telemetry.TireRF_RumblePitch}}` | Players RF Tire Sound rumblestrip pitch (Hz) |
| `{{telemetry.TireLR_RumblePitch}}` | Players LR Tire Sound rumblestrip pitch (Hz) |
| `{{telemetry.TireRR_RumblePitch}}` | Players RR Tire Sound rumblestrip pitch (Hz) |
| `{{telemetry.SteeringWheelTorque}}` | Output torque on steering shaft (N*m) |
| `{{telemetry.VelocityZ}}` | Z velocity (m/s) |
| `{{telemetry.VelocityY}}` | Y velocity (m/s) |
| `{{telemetry.VelocityX}}` | X velocity (m/s) |
| `{{telemetry.YawRate}}` | Yaw rate (rad/s) |
| `{{telemetry.PitchRate}}` | Pitch rate (rad/s) |
| `{{telemetry.RollRate}}` | Roll rate (rad/s) |
| `{{telemetry.VertAccel}}` | Vertical acceleration (including gravity) (m/s^2) |
| `{{telemetry.LatAccel}}` | Lateral acceleration (including gravity) (m/s^2) |
| `{{telemetry.LongAccel}}` | Longitudinal acceleration (including gravity) (m/s^2) |
| `{{telemetry.dcStarter}}` | In car trigger car starter |
| `{{telemetry.dcPitSpeedLimiterToggle}}` | Track if pit speed limiter system is enabled |
| `{{telemetry.dcTractionControlToggle}}` | In car traction control active |
| `{{telemetry.dcHeadlightFlash}}` | In car headlight flash control active |
| `{{telemetry.dcLowFuelAccept}}` | In car low fuel accept |
| `{{telemetry.dpRFTireChange}}` | Pitstop rf tire change request |
| `{{telemetry.dpLFTireChange}}` | Pitstop lf tire change request |
| `{{telemetry.dpRRTireChange}}` | Pitstop rr tire change request |
| `{{telemetry.dpLRTireChange}}` | Pitstop lr tire change request |
| `{{telemetry.dpFuelFill}}` | Pitstop fuel fill flag |
| `{{telemetry.dpFuelAutoFillEnabled}}` | Pitstop auto fill fuel system enabled |
| `{{telemetry.dpFuelAutoFillActive}}` | Pitstop auto fill fuel next stop flag |
| `{{telemetry.dpWindshieldTearoff}}` | Pitstop windshield tearoff |
| `{{telemetry.dpFuelAddKg}}` | Pitstop fuel add amount (kg) |
| `{{telemetry.dpFastRepair}}` | Pitstop fast repair set |
| `{{telemetry.dcDashPage}}` | In car dash display page adjustment |
| `{{telemetry.dcPowerSteering}}` | In car power steering adjustment |
| `{{telemetry.dcBrakeBias}}` | In car brake bias adjustment |
| `{{telemetry.dpLFTireColdPress}}` | Pitstop lf tire cold pressure adjustment (Pa) |
| `{{telemetry.dpRFTireColdPress}}` | Pitstop rf cold tire pressure adjustment (Pa) |
| `{{telemetry.dpLRTireColdPress}}` | Pitstop lr tire cold pressure adjustment (Pa) |
| `{{telemetry.dpRRTireColdPress}}` | Pitstop rr cold tire pressure adjustment (Pa) |
| `{{telemetry.dcTractionControl}}` | In car traction control adjustment |
| `{{telemetry.dcABS}}` | In car abs adjustment |
| `{{telemetry.dcThrottleShape}}` | In car throttle shape adjustment |
| `{{telemetry.dcToggleWindshieldWipers}}` | In car turn wipers on or off |
| `{{telemetry.dcTriggerWindshieldWipers}}` | In car momentarily turn on wipers |
| `{{telemetry.RFbrakeLinePress}}` | RF brake line pressure (bar) |
| `{{telemetry.RFcoldPressure}}` | RF tire cold pressure as set in the garage (kPa) |
| `{{telemetry.RFodometer}}` | RF distance tire traveled since being placed on car (m) |
| `{{telemetry.RFtempCL}}` | RF tire left carcass temperature (C) |
| `{{telemetry.RFtempCM}}` | RF tire middle carcass temperature (C) |
| `{{telemetry.RFtempCR}}` | RF tire right carcass temperature (C) |
| `{{telemetry.RFwearL}}` | RF tire left percent tread remaining (%) |
| `{{telemetry.RFwearM}}` | RF tire middle percent tread remaining (%) |
| `{{telemetry.RFwearR}}` | RF tire right percent tread remaining (%) |
| `{{telemetry.LFbrakeLinePress}}` | LF brake line pressure (bar) |
| `{{telemetry.LFcoldPressure}}` | LF tire cold pressure as set in the garage (kPa) |
| `{{telemetry.LFodometer}}` | LF distance tire traveled since being placed on car (m) |
| `{{telemetry.LFtempCL}}` | LF tire left carcass temperature (C) |
| `{{telemetry.LFtempCM}}` | LF tire middle carcass temperature (C) |
| `{{telemetry.LFtempCR}}` | LF tire right carcass temperature (C) |
| `{{telemetry.LFwearL}}` | LF tire left percent tread remaining (%) |
| `{{telemetry.LFwearM}}` | LF tire middle percent tread remaining (%) |
| `{{telemetry.LFwearR}}` | LF tire right percent tread remaining (%) |
| `{{telemetry.FuelUsePerHour}}` | Engine fuel used instantaneous (kg/h) |
| `{{telemetry.Voltage}}` | Engine voltage (V) |
| `{{telemetry.WaterTemp}}` | Engine coolant temp (C) |
| `{{telemetry.WaterLevel}}` | Engine coolant level (l) |
| `{{telemetry.FuelPress}}` | Engine fuel pressure (bar) |
| `{{telemetry.OilTemp}}` | Engine oil temperature (C) |
| `{{telemetry.OilPress}}` | Engine oil pressure (bar) |
| `{{telemetry.OilLevel}}` | Engine oil level (l) |
| `{{telemetry.ManifoldPress}}` | Engine manifold pressure (bar) |
| `{{telemetry.FuelLevel}}` | Liters of fuel remaining (l) |
| `{{telemetry.Engine0_RPM}}` | Engine0 engine rpm (revs/min) |
| `{{telemetry.RRbrakeLinePress}}` | RR brake line pressure (bar) |
| `{{telemetry.RRcoldPressure}}` | RR tire cold pressure as set in the garage (kPa) |
| `{{telemetry.RRodometer}}` | RR distance tire traveled since being placed on car (m) |
| `{{telemetry.RRtempCL}}` | RR tire left carcass temperature (C) |
| `{{telemetry.RRtempCM}}` | RR tire middle carcass temperature (C) |
| `{{telemetry.RRtempCR}}` | RR tire right carcass temperature (C) |
| `{{telemetry.RRwearL}}` | RR tire left percent tread remaining (%) |
| `{{telemetry.RRwearM}}` | RR tire middle percent tread remaining (%) |
| `{{telemetry.RRwearR}}` | RR tire right percent tread remaining (%) |
| `{{telemetry.LRbrakeLinePress}}` | LR brake line pressure (bar) |
| `{{telemetry.LRcoldPressure}}` | LR tire cold pressure as set in the garage (kPa) |
| `{{telemetry.LRodometer}}` | LR distance tire traveled since being placed on car (m) |
| `{{telemetry.LRtempCL}}` | LR tire left carcass temperature (C) |
| `{{telemetry.LRtempCM}}` | LR tire middle carcass temperature (C) |
| `{{telemetry.LRtempCR}}` | LR tire right carcass temperature (C) |
| `{{telemetry.LRwearL}}` | LR tire left percent tread remaining (%) |
| `{{telemetry.LRwearM}}` | LR tire middle percent tread remaining (%) |
| `{{telemetry.LRwearR}}` | LR tire right percent tread remaining (%) |
| `{{telemetry.LRshockDefl}}` | LR shock deflection (m) |
| `{{telemetry.LRshockVel}}` | LR shock velocity (m/s) |
| `{{telemetry.RRshockDefl}}` | RR shock deflection (m) |
| `{{telemetry.RRshockVel}}` | RR shock velocity (m/s) |
| `{{telemetry.LFshockDefl}}` | LF shock deflection (m) |
| `{{telemetry.LFshockVel}}` | LF shock velocity (m/s) |
| `{{telemetry.RFshockDefl}}` | RF shock deflection (m) |
| `{{telemetry.RFshockVel}}` | RF shock velocity (m/s) |
| `{{telemetry.dcDRSToggle}}` | In car toggle DRS |
| `{{telemetry.dcTearOffVisor}}` | In car tear off visor film |
| `{{telemetry.dpTireChange}}` | Pitstop all tire change request |
| `{{telemetry.dpWingFront}}` | Pitstop front wing adjustment |
| `{{telemetry.dcBrakeBiasFine}}` | In car brake bias fine adjustment |
| `{{telemetry.dcPeakBrakeBias}}` | In car peak brake bias adjustment |
| `{{telemetry.dcBrakeMisc}}` | In car brake misc adjustment |
| `{{telemetry.dcEngineBraking}}` | In car engine braking adjustment |
| `{{telemetry.dcMGUKDeployMode}}` | In car MGU-K deployment mode level adjustment |
| `{{telemetry.dcMGUKRegenGain}}` | In car MUG-K re-gen gain adjustment |
| `{{telemetry.dcDiffEntry}}` | In car diff entry adjustment |
| `{{telemetry.dcDiffMiddle}}` | In car diff middle adjustment |
| `{{telemetry.dcDiffExit}}` | In car diff exit adjustment |
| `{{telemetry.DRS_Status}}` | Drag Reduction System Status |
| `{{telemetry.PowerMGU_K}}` | Engine MGU-K mechanical power (W) |
| `{{telemetry.TorqueMGU_K}}` | Engine MGU-K mechanical torque (Nm) |
| `{{telemetry.PowerMGU_H}}` | Engine MGU-H mechanical power (W) |
| `{{telemetry.EnergyERSBattery}}` | Engine ERS battery charge (J) |
| `{{telemetry.EnergyERSBatteryPct}}` | Engine ERS battery charge as a percent (%) |
| `{{telemetry.EnergyBatteryToMGU_KLap}}` | Electrical energy from battery to MGU-K per lap (J) |
| `{{telemetry.EnergyMGU_KLapDeployPct}}` | Electrical energy available to MGU-K per lap as a percent (%) |
| `{{telemetry.Engine1_RPM}}` | Engine1 engine rpm (revs/min) |
| `{{telemetry.CFshockDefl}}` | CF shock deflection (m) |
| `{{telemetry.CFshockVel}}` | CF shock velocity (m/s) |
| `{{telemetry.ROLLFshockDefl}}` | ROLLF shock deflection (m) |
| `{{telemetry.ROLLFshockVel}}` | ROLLF shock velocity (m/s) |
| `{{telemetry.CRshockDefl}}` | CR shock deflection (m) |
| `{{telemetry.CRshockVel}}` | CR shock velocity (m/s) |
| `{{telemetry.ROLLRshockDefl}}` | ROLLR shock deflection (m) |
| `{{telemetry.ROLLRshockVel}}` | ROLLR shock velocity (m/s) |
| `{{telemetry.dcTractionControl2}}` | In car traction control 2 adjustment |
| `{{telemetry.LRSHshockDefl}}` | LRSH shock deflection (m) |
| `{{telemetry.LRSHshockVel}}` | LRSH shock velocity (m/s) |
| `{{telemetry.RRSHshockDefl}}` | RRSH shock deflection (m) |
| `{{telemetry.RRSHshockVel}}` | RRSH shock velocity (m/s) |
| `{{telemetry.dpRTireChange}}` | Pitstop right tire change request |
| `{{telemetry.dpLTireChange}}` | Pitstop left tire change request |
| `{{telemetry.LFSHshockDefl}}` | LFSH shock deflection (m) |
| `{{telemetry.LFSHshockVel}}` | LFSH shock velocity (m/s) |
| `{{telemetry.RFSHshockDefl}}` | RFSH shock deflection (m) |
| `{{telemetry.RFSHshockVel}}` | RFSH shock velocity (m/s) |
| `{{telemetry.dcRFBrakeAttachedToggle}}` | In car Right Front Brake attached(1) or detached(0) |
| `{{telemetry.LR2shockDefl}}` | LR2 shock deflection (m) |
| `{{telemetry.LR2shockVel}}` | LR2 shock velocity (m/s) |
| `{{telemetry.DRS_Count}}` | Drag Reduction System count of usage |
| `{{telemetry.dcLaunchRPM}}` | In car launch rpm adjustment |
| `{{telemetry.dcAntiRollFront}}` | In car front anti roll bar adjustment |
| `{{telemetry.dcAntiRollRear}}` | In car rear anti roll bar adjustment |
| `{{telemetry.HFshockDefl}}` | HF shock deflection (m) |
| `{{telemetry.HFshockVel}}` | HF shock velocity (m/s) |
| `{{telemetry.HRshockDefl}}` | HR shock deflection (m) |
| `{{telemetry.HRshockVel}}` | HR shock velocity (m/s) |
| `{{telemetry.dcPushToPass}}` | In car trigger push to pass |
| `{{telemetry.dpWingRear}}` | Pitstop rear wing adjustment |
| `{{telemetry.dcWeightJackerRight}}` | In car right wedge/weight jacker adjustment |
| `{{telemetry.dcFuelMixture}}` | In car fuel mixture adjustment |
| `{{telemetry.dcDashPage2}}` | In car second dash display page adjustment |
| `{{telemetry.dpQTape}}` | Pitstop qualify tape adjustment |
| `{{telemetry.dpWeightJackerLeft}}` | Pitstop left wedge/weight jacker adjustment |
| `{{telemetry.dpWeightJackerRight}}` | Pitstop right wedge/weight jacker adjustment |
| `{{telemetry.dcInLapToggle}}` | In car toggle in lap settings |
| `{{telemetry.dcFCYToggle}}` | In car toggle full course yellow mode |
| `{{telemetry.dcFuelCutPosition}}` | In car adv end straight fuel cut |
| `{{telemetry.dcFuelNoCutToggle}}` | In car fuel cut on straight active |
| `{{telemetry.dcMGUKDeployFixed}}` | In car MGU-K fixed deployment level adjustment |
| `{{telemetry.dcHysBoostHold}}` | In car hold HYS deploy |
| `{{telemetry.dpPowerSteering}}` | Pitstop power steering adjustment |
| `{{telemetry.dcTractionControl4}}` | In car traction control 4 adjustment |
| `{{telemetry.dcTractionControl3}}` | In car traction control 3 adjustment |
| `{{telemetry.dpChargeAddKWh}}` | Pitstop charge add amount (kWh) |
| `{{telemetry.dcEnginePower}}` | In car engine power adjustment |

## Session Info

Raw session data from iRacing using dot-notation paths. Arrays (drivers list, session results, cameras) are excluded.

### Weekend Info

Track metadata, weather conditions, and session configuration.

| Variable | Description |
|----------|-------------|
| `{{sessionInfo.WeekendInfo.TrackName}}` | Internal track name |
| `{{sessionInfo.WeekendInfo.TrackID}}` | Track ID number |
| `{{sessionInfo.WeekendInfo.TrackLength}}` | Track length with units |
| `{{sessionInfo.WeekendInfo.TrackLengthOfficial}}` | Official track length |
| `{{sessionInfo.WeekendInfo.TrackDisplayName}}` | Full track display name |
| `{{sessionInfo.WeekendInfo.TrackDisplayShortName}}` | Short track name |
| `{{sessionInfo.WeekendInfo.TrackConfigName}}` | Track configuration name |
| `{{sessionInfo.WeekendInfo.TrackCity}}` | City |
| `{{sessionInfo.WeekendInfo.TrackState}}` | State or province |
| `{{sessionInfo.WeekendInfo.TrackCountry}}` | Country |
| `{{sessionInfo.WeekendInfo.TrackAltitude}}` | Elevation with units |
| `{{sessionInfo.WeekendInfo.TrackLatitude}}` | Latitude |
| `{{sessionInfo.WeekendInfo.TrackLongitude}}` | Longitude |
| `{{sessionInfo.WeekendInfo.TrackNorthOffset}}` | North offset (radians) |
| `{{sessionInfo.WeekendInfo.TrackNumTurns}}` | Number of turns |
| `{{sessionInfo.WeekendInfo.TrackPitSpeedLimit}}` | Pit speed limit with units |
| `{{sessionInfo.WeekendInfo.TrackPaceSpeed}}` | Pace car speed with units |
| `{{sessionInfo.WeekendInfo.TrackNumPitStalls}}` | Number of pit stalls |
| `{{sessionInfo.WeekendInfo.TrackType}}` | Track type (road, oval, etc.) |
| `{{sessionInfo.WeekendInfo.TrackDirection}}` | Direction (turns left/right/neutral) |
| `{{sessionInfo.WeekendInfo.TrackWeatherType}}` | Weather type |
| `{{sessionInfo.WeekendInfo.TrackSkies}}` | Sky conditions |
| `{{sessionInfo.WeekendInfo.TrackSurfaceTemp}}` | Surface temperature with units |
| `{{sessionInfo.WeekendInfo.TrackSurfaceTempCrew}}` | Surface temp at crew location |
| `{{sessionInfo.WeekendInfo.TrackAirTemp}}` | Air temperature with units |
| `{{sessionInfo.WeekendInfo.TrackAirPressure}}` | Air pressure with units |
| `{{sessionInfo.WeekendInfo.TrackAirDensity}}` | Air density with units |
| `{{sessionInfo.WeekendInfo.TrackWindVel}}` | Wind velocity with units |
| `{{sessionInfo.WeekendInfo.TrackWindDir}}` | Wind direction with units |
| `{{sessionInfo.WeekendInfo.TrackRelativeHumidity}}` | Relative humidity percentage |
| `{{sessionInfo.WeekendInfo.TrackFogLevel}}` | Fog level |
| `{{sessionInfo.WeekendInfo.TrackPrecipitation}}` | Precipitation level |
| `{{sessionInfo.WeekendInfo.TrackCleanup}}` | Track cleanup state |
| `{{sessionInfo.WeekendInfo.TrackDynamicTrack}}` | Dynamic track rubber enabled |
| `{{sessionInfo.WeekendInfo.TrackVersion}}` | Track version string |
| `{{sessionInfo.WeekendInfo.SeriesID}}` | Series ID |
| `{{sessionInfo.WeekendInfo.SeasonID}}` | Season ID |
| `{{sessionInfo.WeekendInfo.SessionID}}` | Session ID |
| `{{sessionInfo.WeekendInfo.SubSessionID}}` | Sub-session ID |
| `{{sessionInfo.WeekendInfo.LeagueID}}` | League ID (0 if not league) |
| `{{sessionInfo.WeekendInfo.Official}}` | Official session (0/1) |
| `{{sessionInfo.WeekendInfo.RaceWeek}}` | Race week number |
| `{{sessionInfo.WeekendInfo.EventType}}` | Event type |
| `{{sessionInfo.WeekendInfo.Category}}` | Category (Road, Oval, etc.) |
| `{{sessionInfo.WeekendInfo.SimMode}}` | Simulation mode |
| `{{sessionInfo.WeekendInfo.TeamRacing}}` | Team racing enabled (0/1) |
| `{{sessionInfo.WeekendInfo.MinDrivers}}` | Min drivers per team |
| `{{sessionInfo.WeekendInfo.MaxDrivers}}` | Max drivers per team |
| `{{sessionInfo.WeekendInfo.DCRuleSet}}` | Driver change rule set |
| `{{sessionInfo.WeekendInfo.QualifierMustStartRace}}` | Qualifier must start race (0/1) |
| `{{sessionInfo.WeekendInfo.NumCarClasses}}` | Number of car classes |
| `{{sessionInfo.WeekendInfo.NumCarTypes}}` | Number of car types |
| `{{sessionInfo.WeekendInfo.HeatRacing}}` | Heat racing enabled (0/1) |
| `{{sessionInfo.WeekendInfo.BuildType}}` | Build type |
| `{{sessionInfo.WeekendInfo.BuildTarget}}` | Build target |
| `{{sessionInfo.WeekendInfo.BuildVersion}}` | iRacing build version |
| `{{sessionInfo.WeekendInfo.RaceFarm}}` | Race farm ID |
| `{{sessionInfo.WeekendInfo.WeekendOptions.NumStarters}}` | Number of starters |
| `{{sessionInfo.WeekendInfo.WeekendOptions.StartingGrid}}` | Starting grid type |
| `{{sessionInfo.WeekendInfo.WeekendOptions.QualifyScoring}}` | Qualifying scoring method |
| `{{sessionInfo.WeekendInfo.WeekendOptions.CourseCautions}}` | Course cautions type |
| `{{sessionInfo.WeekendInfo.WeekendOptions.StandingStart}}` | Standing start (0/1) |
| `{{sessionInfo.WeekendInfo.WeekendOptions.ShortParadeLap}}` | Short parade lap (0/1) |
| `{{sessionInfo.WeekendInfo.WeekendOptions.Restarts}}` | Restart type |
| `{{sessionInfo.WeekendInfo.WeekendOptions.WeatherType}}` | Weather type setting |
| `{{sessionInfo.WeekendInfo.WeekendOptions.Skies}}` | Sky setting |
| `{{sessionInfo.WeekendInfo.WeekendOptions.WindDirection}}` | Wind direction setting |
| `{{sessionInfo.WeekendInfo.WeekendOptions.WindSpeed}}` | Wind speed setting |
| `{{sessionInfo.WeekendInfo.WeekendOptions.WeatherTemp}}` | Weather temperature setting |
| `{{sessionInfo.WeekendInfo.WeekendOptions.RelativeHumidity}}` | Relative humidity setting |
| `{{sessionInfo.WeekendInfo.WeekendOptions.FogLevel}}` | Fog level setting |
| `{{sessionInfo.WeekendInfo.WeekendOptions.TimeOfDay}}` | Time of day |
| `{{sessionInfo.WeekendInfo.WeekendOptions.Date}}` | Session date |
| `{{sessionInfo.WeekendInfo.WeekendOptions.EarthRotationSpeedupFactor}}` | Time speed multiplier |
| `{{sessionInfo.WeekendInfo.WeekendOptions.Unofficial}}` | Unofficial session (0/1) |
| `{{sessionInfo.WeekendInfo.WeekendOptions.CommercialMode}}` | Commercial mode |
| `{{sessionInfo.WeekendInfo.WeekendOptions.NightMode}}` | Night mode |
| `{{sessionInfo.WeekendInfo.WeekendOptions.IsFixedSetup}}` | Fixed setup (0/1) |
| `{{sessionInfo.WeekendInfo.WeekendOptions.StrictLapsChecking}}` | Strict laps checking |
| `{{sessionInfo.WeekendInfo.WeekendOptions.HasOpenRegistration}}` | Open registration (0/1) |
| `{{sessionInfo.WeekendInfo.WeekendOptions.HardcoreLevel}}` | Hardcore level |
| `{{sessionInfo.WeekendInfo.WeekendOptions.NumJokerLaps}}` | Number of joker laps |
| `{{sessionInfo.WeekendInfo.WeekendOptions.IncidentLimit}}` | Incident limit |
| `{{sessionInfo.WeekendInfo.WeekendOptions.IncidentWarningInitialLimit}}` | First incident warning limit |
| `{{sessionInfo.WeekendInfo.WeekendOptions.IncidentWarningSubsequentLimit}}` | Subsequent incident warning limit |
| `{{sessionInfo.WeekendInfo.WeekendOptions.FastRepairsLimit}}` | Fast repairs limit |
| `{{sessionInfo.WeekendInfo.WeekendOptions.GreenWhiteCheckeredLimit}}` | GWC attempts limit |
| `{{sessionInfo.WeekendInfo.TelemetryOptions.TelemetryDiskFile}}` | Telemetry disk file path |

### Session

Current session index. Individual session entries (arrays) are not available.

| Variable | Description |
|----------|-------------|
| `{{sessionInfo.SessionInfo.CurrentSessionNum}}` | Current session number index |

### Driver / Car Info

Your car specs and setup metadata. Per-driver entries (arrays) are not available.

| Variable | Description |
|----------|-------------|
| `{{sessionInfo.DriverInfo.DriverCarIdx}}` | Your car index |
| `{{sessionInfo.DriverInfo.DriverUserID}}` | Your user ID |
| `{{sessionInfo.DriverInfo.PaceCarIdx}}` | Pace car index |
| `{{sessionInfo.DriverInfo.DriverIsAdmin}}` | You are admin (0/1) |
| `{{sessionInfo.DriverInfo.DriverHeadPosX}}` | Head position X |
| `{{sessionInfo.DriverInfo.DriverHeadPosY}}` | Head position Y |
| `{{sessionInfo.DriverInfo.DriverHeadPosZ}}` | Head position Z |
| `{{sessionInfo.DriverInfo.DriverCarIsElectric}}` | Car is electric (0/1) |
| `{{sessionInfo.DriverInfo.DriverCarIdleRPM}}` | Idle RPM |
| `{{sessionInfo.DriverInfo.DriverCarRedLine}}` | Redline RPM |
| `{{sessionInfo.DriverInfo.DriverCarEngCylinderCount}}` | Engine cylinder count |
| `{{sessionInfo.DriverInfo.DriverCarFuelKgPerLtr}}` | Fuel weight (kg per liter) |
| `{{sessionInfo.DriverInfo.DriverCarFuelMaxLtr}}` | Max fuel capacity (liters) |
| `{{sessionInfo.DriverInfo.DriverCarMaxFuelPct}}` | Max fuel fill percentage |
| `{{sessionInfo.DriverInfo.DriverCarGearNumForward}}` | Number of forward gears |
| `{{sessionInfo.DriverInfo.DriverCarGearNeutral}}` | Neutral gear index |
| `{{sessionInfo.DriverInfo.DriverCarGearReverse}}` | Reverse gear index |
| `{{sessionInfo.DriverInfo.DriverGearboxType}}` | Gearbox type |
| `{{sessionInfo.DriverInfo.DriverGearboxControlType}}` | Gearbox control type |
| `{{sessionInfo.DriverInfo.DriverCarShiftAid}}` | Shift aid enabled |
| `{{sessionInfo.DriverInfo.DriverCarSLFirstRPM}}` | Shift light first RPM |
| `{{sessionInfo.DriverInfo.DriverCarSLShiftRPM}}` | Shift light shift RPM |
| `{{sessionInfo.DriverInfo.DriverCarSLLastRPM}}` | Shift light last RPM |
| `{{sessionInfo.DriverInfo.DriverCarSLBlinkRPM}}` | Shift light blink RPM |
| `{{sessionInfo.DriverInfo.DriverCarVersion}}` | Car version string |
| `{{sessionInfo.DriverInfo.DriverPitTrkPct}}` | Pit entry track percentage |
| `{{sessionInfo.DriverInfo.DriverCarEstLapTime}}` | Estimated lap time (seconds) |
| `{{sessionInfo.DriverInfo.DriverSetupName}}` | Setup name |
| `{{sessionInfo.DriverInfo.DriverSetupIsModified}}` | Setup modified (0/1) |
| `{{sessionInfo.DriverInfo.DriverSetupLoadTypeName}}` | Setup load type |
| `{{sessionInfo.DriverInfo.DriverSetupPassedTech}}` | Setup passed tech (0/1) |
| `{{sessionInfo.DriverInfo.DriverIncidentCount}}` | Your incident count |
| `{{sessionInfo.DriverInfo.DriverBrakeCurvingFactor}}` | Brake curving factor |

### Radio

Radio selection. Per-frequency entries (arrays) are not available.

| Variable | Description |
|----------|-------------|
| `{{sessionInfo.RadioInfo.SelectedRadioNum}}` | Currently selected radio number |

### Car Setup

Current car setup values. Available fields vary by car.

| Variable | Description |
|----------|-------------|
| `{{sessionInfo.CarSetup.UpdateCount}}` | Setup update count |
| `{{sessionInfo.CarSetup.TiresAero.TireType.TireType}}` | Tire compound type |
| `{{sessionInfo.CarSetup.TiresAero.LeftFront.ColdPressure}}` | LF cold pressure |
| `{{sessionInfo.CarSetup.TiresAero.LeftFront.LastHotPressure}}` | LF last hot pressure |
| `{{sessionInfo.CarSetup.TiresAero.LeftFront.LastTempsOMI}}` | LF last temps (outside, middle, inside) |
| `{{sessionInfo.CarSetup.TiresAero.LeftFront.TreadRemaining}}` | LF tread remaining |
| `{{sessionInfo.CarSetup.TiresAero.LeftRear.ColdPressure}}` | LR cold pressure |
| `{{sessionInfo.CarSetup.TiresAero.LeftRear.LastHotPressure}}` | LR last hot pressure |
| `{{sessionInfo.CarSetup.TiresAero.LeftRear.LastTempsOMI}}` | LR last temps (outside, middle, inside) |
| `{{sessionInfo.CarSetup.TiresAero.LeftRear.TreadRemaining}}` | LR tread remaining |
| `{{sessionInfo.CarSetup.TiresAero.RightFront.ColdPressure}}` | RF cold pressure |
| `{{sessionInfo.CarSetup.TiresAero.RightFront.LastHotPressure}}` | RF last hot pressure |
| `{{sessionInfo.CarSetup.TiresAero.RightFront.LastTempsIMO}}` | RF last temps (inside, middle, outside) |
| `{{sessionInfo.CarSetup.TiresAero.RightFront.TreadRemaining}}` | RF tread remaining |
| `{{sessionInfo.CarSetup.TiresAero.RightRear.ColdPressure}}` | RR cold pressure |
| `{{sessionInfo.CarSetup.TiresAero.RightRear.LastHotPressure}}` | RR last hot pressure |
| `{{sessionInfo.CarSetup.TiresAero.RightRear.LastTempsIMO}}` | RR last temps (inside, middle, outside) |
| `{{sessionInfo.CarSetup.TiresAero.RightRear.TreadRemaining}}` | RR tread remaining |
| `{{sessionInfo.CarSetup.TiresAero.FrontAero.FlapAngle}}` | Front flap angle |
| `{{sessionInfo.CarSetup.TiresAero.RearAero.WingAngle}}` | Rear wing angle |
| `{{sessionInfo.CarSetup.TiresAero.RearAero.GurneyFlap}}` | Gurney flap size |
| `{{sessionInfo.CarSetup.TiresAero.AeroCalculator.FrontRhAtSpeed}}` | Front ride height at speed |
| `{{sessionInfo.CarSetup.TiresAero.AeroCalculator.RearRhAtSpeed}}` | Rear ride height at speed |
| `{{sessionInfo.CarSetup.TiresAero.AeroCalculator.FrontDownforce}}` | Front downforce percentage |
| `{{sessionInfo.CarSetup.TiresAero.AeroCalculator.DownforceToDrag}}` | Downforce to drag ratio |
| `{{sessionInfo.CarSetup.Chassis.Front.ArbDiameter}}` | Front anti-roll bar diameter |
| `{{sessionInfo.CarSetup.Chassis.Front.ArbPosition}}` | Front ARB position |
| `{{sessionInfo.CarSetup.Chassis.Front.HeaveSpringRate}}` | Front heave spring rate |
| `{{sessionInfo.CarSetup.Chassis.Front.HeaveSpringGap}}` | Front heave spring gap |
| `{{sessionInfo.CarSetup.Chassis.Front.BrakePressureBias}}` | Brake pressure bias |
| `{{sessionInfo.CarSetup.Chassis.Front.DisplayPage}}` | Steering wheel display page |
| `{{sessionInfo.CarSetup.Chassis.LeftFront.CornerWeight}}` | LF corner weight |
| `{{sessionInfo.CarSetup.Chassis.LeftFront.RideHeight}}` | LF ride height |
| `{{sessionInfo.CarSetup.Chassis.LeftFront.PushrodLength}}` | LF pushrod length |
| `{{sessionInfo.CarSetup.Chassis.LeftFront.TorsionBar}}` | LF torsion bar diameter |
| `{{sessionInfo.CarSetup.Chassis.LeftFront.BumpStiffness}}` | LF bump stiffness |
| `{{sessionInfo.CarSetup.Chassis.LeftFront.ReboundStiffness}}` | LF rebound stiffness |
| `{{sessionInfo.CarSetup.Chassis.LeftFront.Camber}}` | LF camber angle |
| `{{sessionInfo.CarSetup.Chassis.LeftFront.ToeIn}}` | LF toe-in |
| `{{sessionInfo.CarSetup.Chassis.LeftRear.CornerWeight}}` | LR corner weight |
| `{{sessionInfo.CarSetup.Chassis.LeftRear.RideHeight}}` | LR ride height |
| `{{sessionInfo.CarSetup.Chassis.LeftRear.PushrodLength}}` | LR pushrod length |
| `{{sessionInfo.CarSetup.Chassis.LeftRear.SpringRate}}` | LR spring rate |
| `{{sessionInfo.CarSetup.Chassis.LeftRear.BumpStiffness}}` | LR bump stiffness |
| `{{sessionInfo.CarSetup.Chassis.LeftRear.ReboundStiffness}}` | LR rebound stiffness |
| `{{sessionInfo.CarSetup.Chassis.LeftRear.Camber}}` | LR camber angle |
| `{{sessionInfo.CarSetup.Chassis.LeftRear.ToeIn}}` | LR toe-in |
| `{{sessionInfo.CarSetup.Chassis.Rear.FuelLevel}}` | Fuel level |
| `{{sessionInfo.CarSetup.Chassis.Rear.ArbDiameter}}` | Rear anti-roll bar diameter |
| `{{sessionInfo.CarSetup.Chassis.Rear.ArbPosition}}` | Rear ARB position |
| `{{sessionInfo.CarSetup.Chassis.Rear.RdSpringRate}}` | Rear damper spring rate |
| `{{sessionInfo.CarSetup.Chassis.Rear.RdSpringGap}}` | Rear damper spring gap |
| `{{sessionInfo.CarSetup.Chassis.RightFront.CornerWeight}}` | RF corner weight |
| `{{sessionInfo.CarSetup.Chassis.RightFront.PushrodLength}}` | RF pushrod length |
| `{{sessionInfo.CarSetup.Chassis.RightFront.TorsionBar}}` | RF torsion bar diameter |
| `{{sessionInfo.CarSetup.Chassis.RightFront.BumpStiffness}}` | RF bump stiffness |
| `{{sessionInfo.CarSetup.Chassis.RightFront.ReboundStiffness}}` | RF rebound stiffness |
| `{{sessionInfo.CarSetup.Chassis.RightFront.Camber}}` | RF camber angle |
| `{{sessionInfo.CarSetup.Chassis.RightFront.ToeIn}}` | RF toe-in |
| `{{sessionInfo.CarSetup.Chassis.RightRear.CornerWeight}}` | RR corner weight |
| `{{sessionInfo.CarSetup.Chassis.RightRear.PushrodLength}}` | RR pushrod length |
| `{{sessionInfo.CarSetup.Chassis.RightRear.SpringRate}}` | RR spring rate |
| `{{sessionInfo.CarSetup.Chassis.RightRear.BumpStiffness}}` | RR bump stiffness |
| `{{sessionInfo.CarSetup.Chassis.RightRear.ReboundStiffness}}` | RR rebound stiffness |
| `{{sessionInfo.CarSetup.Chassis.RightRear.Camber}}` | RR camber angle |
| `{{sessionInfo.CarSetup.Chassis.RightRear.ToeIn}}` | RR toe-in |
| `{{sessionInfo.CarSetup.Drivetrain.Differential.ClutchPlates}}` | Clutch plate count |
| `{{sessionInfo.CarSetup.Drivetrain.Differential.Preload}}` | Differential preload |
| `{{sessionInfo.CarSetup.Drivetrain.Differential.DriveAngle}}` | Differential drive angle |
| `{{sessionInfo.CarSetup.Drivetrain.Differential.CoastAngle}}` | Differential coast angle |
| `{{sessionInfo.CarSetup.Drivetrain.EngineInCarDials.ThrottleShaping}}` | Throttle shaping / map |
| `{{sessionInfo.CarSetup.Drivetrain.EngineInCarDials.LaunchControlRpm}}` | Launch control RPM setting |
