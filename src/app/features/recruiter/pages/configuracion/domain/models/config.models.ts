export interface SubItem {
  id: string;
  icon: string;
  label: string;
}

export interface ConfigCategory {
  id: string;
  icon: string;
  label: string;
  subItems: SubItem[];
  comingSoon?: boolean;
}
