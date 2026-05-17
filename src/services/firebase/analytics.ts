type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

export async function logAnalyticsEvent(name: string, params?: AnalyticsPayload) {
  void name;
  void params;
}
