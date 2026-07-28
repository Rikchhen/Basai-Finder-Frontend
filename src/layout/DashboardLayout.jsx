import styled from 'styled-components';

export function DashboardLayout({ navItems, activeItem, onChange, children }) {
  return (
    <DashboardShell>
      <Sidebar aria-label="Settings sections">
        {navItems.map((item) => (
          <SidebarButton
            key={item.key}
            type="button"
            $active={activeItem === item.key}
            onClick={() => onChange(item.key)}
          >
            <item.icon size={18} />
            {item.label}
          </SidebarButton>
        ))}
      </Sidebar>
      <Content>{children}</Content>
    </DashboardShell>
  );
}

const DashboardShell = styled.div`
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: ${({ theme }) => theme.spacing(3)};
  max-width: 1180px;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing(4)} ${theme.spacing(2)}`};

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 96px;
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.spacing(1)};
  height: fit-content;

  @media (max-width: 820px) {
    position: static;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    overflow-x: auto;
  }
`;

const SidebarButton = styled.button`
  display: flex;
  min-height: 46px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  border: 1px solid ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.outlineVariant)};
  border-radius: ${({ theme }) => theme.roundness};
  background: ${({ $active, theme }) => ($active ? 'rgba(26, 79, 157, 0.1)' : theme.colors.surfaceContainerLowest)};
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.onSurfaceVariant)};
  padding: ${({ theme }) => `${theme.spacing(1)} ${theme.spacing(1.5)}`};
  font-weight: 800;
  transition: all 200ms ease-in-out;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.primary};
  }
`;

const Content = styled.div`
  min-width: 0;
  transition: opacity 200ms ease-in-out;
`;
