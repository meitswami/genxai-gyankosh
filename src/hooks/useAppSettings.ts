import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AppSettings {
  kb_public_access: {
    enabled: boolean;
  };
}

const DEFAULT_SETTINGS: AppSettings = {
  kb_public_access: { enabled: false },
};

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['kb_public_access']);

      if (error) throw error;

      const newSettings = { ...DEFAULT_SETTINGS };
      data?.forEach((row: { setting_key: string; setting_value: unknown }) => {
        if (row.setting_key === 'kb_public_access') {
          newSettings.kb_public_access = row.setting_value as { enabled: boolean };
        }
      });
      setSettings(newSettings);
    } catch (error) {
      console.error('Error fetching app settings:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Real-time subscription for settings changes
  useEffect(() => {
    fetchSettings();

    const channel = supabase
      .channel('app-settings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_settings',
        },
        () => {
          fetchSettings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSettings]);

  const updateKBPublicAccess = useCallback(async (enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('app_settings')
        .update({ 
          setting_value: { enabled },
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', 'kb_public_access');

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating KB access:', error);
      return false;
    }
  }, []);

  return {
    settings,
    loading,
    updateKBPublicAccess,
    refetch: fetchSettings,
    isKBPublicAccessEnabled: settings.kb_public_access.enabled,
  };
}
