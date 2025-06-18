export type DaySchedule = {
    enabled: boolean;
    startTime: string;
    endTime: string;
};

export type WeekSchedule = {
    [key: string]: DaySchedule;
};

