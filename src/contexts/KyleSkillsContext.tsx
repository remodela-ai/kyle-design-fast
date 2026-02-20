import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type KyleSkill = {
  id: string;
  name: string;
  description: string;
  icon: string;
  actionType: 'research' | 'create' | 'analyze' | 'automate';
};

export const KYLE_SKILLS: KyleSkill[] = [
  {
    id: 'research',
    name: 'Research',
    description: 'Search for information, competitors, market trends',
    icon: '🔍',
    actionType: 'research',
  },
  {
    id: 'create',
    name: 'Create',
    description: 'Generate designs, proposals, content',
    icon: '🎨',
    actionType: 'create',
  },
  {
    id: 'analyze',
    name: 'Analyze',
    description: 'Review data, evaluate options, compare alternatives',
    icon: '📊',
    actionType: 'analyze',
  },
  {
    id: 'automate',
    name: 'Automate',
    description: 'Schedule tasks, configure workflows',
    icon: '⚡',
    actionType: 'automate',
  },
];

interface KyleSkillsContextType {
  activeSkill: KyleSkill | null;
  isSkillMode: boolean;
  activateSkill: (skill: KyleSkill) => void;
  deactivateSkill: () => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

const KyleSkillsContext = createContext<KyleSkillsContextType | undefined>(undefined);

export function KyleSkillsProvider({ children }: { children: ReactNode }) {
  const [activeSkill, setActiveSkill] = useState<KyleSkill | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const activateSkill = useCallback((skill: KyleSkill) => {
    setActiveSkill(skill);
  }, []);

  const deactivateSkill = useCallback(() => {
    setActiveSkill(null);
  }, []);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const openSidebar = useCallback(() => {
    setIsSidebarOpen(true);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsSidebarOpen(false);
  }, []);

  return (
    <KyleSkillsContext.Provider
      value={{
        activeSkill,
        isSkillMode: activeSkill !== null,
        activateSkill,
        deactivateSkill,
        isSidebarOpen,
        toggleSidebar,
        openSidebar,
        closeSidebar,
      }}
    >
      {children}
    </KyleSkillsContext.Provider>
  );
}

export function useKyleSkills() {
  const context = useContext(KyleSkillsContext);
  if (!context) {
    throw new Error("useKyleSkills must be used within KyleSkillsProvider");
  }
  return context;
}
