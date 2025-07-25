declare module "*.json" {
  const value: any;
  export default value;
}

declare module "./locales/fr-FR/translation.json" {
  const value: {
    common: Record<string, string>;
    auth: Record<string, string>;
    navigation: Record<string, string>;
    chat: Record<string, any>;
    jobs: Record<string, any>;
    profile: Record<string, string>;
    language: Record<string, any>;
    errors: Record<string, string>;
    notifications: Record<string, string>;
  };
  export default value;
}

declare module "./locales/en-US/translation.json" {
  const value: {
    common: Record<string, string>;
    auth: Record<string, string>;
    navigation: Record<string, string>;
    chat: Record<string, any>;
    jobs: Record<string, any>;
    profile: Record<string, string>;
    language: Record<string, any>;
    errors: Record<string, string>;
    notifications: Record<string, string>;
  };
  export default value;
} 