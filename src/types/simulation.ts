export type EducationLevel = 'SD' | 'SMP' | 'SMA';
export type SubjectCategory = 'Fisika' | 'Kimia' | 'Biologi' | 'Pengenalan Sains';

export interface SimulationItem {
  id: string;
  title: string;
  level: EducationLevel;
  subject: SubjectCategory;
  focus: string;
  description: string;
  iconName: string;
  badgeColor: string;
  formula?: string;
  tags: string[];
}

export interface ExperimentData {
  simulationId: string;
  timestamp: string;
  inputs: Record<string, number | string | boolean>;
  results: Record<string, number | string>;
  notes?: string;
}
