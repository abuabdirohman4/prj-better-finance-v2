import type messages from "./i18n/messages/en.json";
import type { Locale } from "./i18n/config";

// Makes t("...") keys type-checked against en.json at build time.
declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
