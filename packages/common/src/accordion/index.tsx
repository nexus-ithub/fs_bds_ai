import { useLocation, Link } from "react-router-dom";
import { Accordion, AccordionSummary, AccordionDetails, Typography, List, ListItem, ListItemText } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

interface MenuItemType {
  label: string;
  path: string; // 클릭 시 이동할 URL
}

interface TogglePanelProps {
  title: string;
  menuItems: MenuItemType[];
  defaultExpanded?: boolean;
}

export const TogglePanel = ({ title, menuItems, defaultExpanded = false }: TogglePanelProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <Accordion defaultExpanded={defaultExpanded}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <List>
          {menuItems.map((item, index) => {
            const isActive = currentPath === item.path || currentPath.startsWith(item.path + "/"); // 서브 경로도 포함
            return (
              <ListItem
                key={index}
                component={Link}
                to={item.path}
                button
                sx={{
                  backgroundColor: isActive ? "rgba(25, 118, 210, 0.1)" : "transparent",
                  "&:hover": { backgroundColor: "rgba(25, 118, 210, 0.2)" },
                }}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            );
          })}
        </List>
      </AccordionDetails>
    </Accordion>
  );
};
