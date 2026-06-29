import { getModelPreference } from "./actions";
import { SettingsClient } from "./SettingsClient";

export default async function SettingsPage() {
  const currentModel = await getModelPreference();
  return <SettingsClient currentModel={currentModel} />;
}
