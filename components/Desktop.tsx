import { DropdownMenu } from './Shared/DropdownMenu';
import { DesktopContainer } from './DesktopContainer';

export const Desktop = () => {
  const windowTitle = 'under.net';
  return (
    <div className="flex-1 min-h-screen font-chicago">
      <DropdownMenu
        windowTitle={windowTitle}
      />
      <DesktopContainer
        windowTitle={windowTitle}
      />
    </div>
  );
}
