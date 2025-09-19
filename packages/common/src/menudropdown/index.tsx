import { FormControl, MenuItem, Select, Typography } from "@mui/material";
import { ChevronDownCustomIcon } from "../icons";

interface DropdownOption {
  value: string;
  label: string;
}

interface MenuDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  padding?: 'default';
  width?: string;
  font?: 'font-b3';
  borderStyle?: 'outlined' | 'underline';
}

export const MenuDropdown: React.FC<MenuDropdownProps> = ({ 
  options = [], 
  value = '', 
  onChange, 
  placeholder = '선택하세요',
  disabled = false,
  padding = 'default',
  width = 'w-[160px]',
  font = 'font-b3',
  borderStyle = 'outlined'
}) => {
  const paddingClasses = {
    default: "6px 8px 6px 10px",
  };

  const fontClasses = {
    'font-b3': {
      fontSize: "13px",
      fontWeight: "var(--font-weight-regular)",
      lineHeight: "20px",
    },
  };

  const getBorderStyles = () => {
    if (borderStyle === 'underline') {
      return {
        '& fieldset': {
          borderRadius: '0px !important',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          border: 'none',
          borderBottom: '1px solid #ccc',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          borderBottom: '1px solid #808080',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          borderBottom: '1px solid #808080',
        },
      };
    }
    return {
      '& fieldset': {
        borderRadius: '2px !important',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#808080',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#808080',
      },
    };
  };

  const handleChange = (event: { target: { value: string } }) => {
    onChange(event.target.value);
  };

  return (
    <FormControl disabled={disabled} className={`${width}`}>
      <Select
        value={value}
        onChange={handleChange}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) {
            return <span style={{ color: '#808080', ...fontClasses[font] }}>{placeholder}</span>;
          }
          return options.find(option => option.value === selected)?.label;
        }}
        IconComponent={() => null}
        MenuProps={{
          disableScrollLock: true,
          MenuListProps: {
            autoFocus: false,
            autoFocusItem: false,
          },
        }}
        sx={{
          '& .MuiSelect-select': {
            padding: paddingClasses[padding],
            display: "flex",
            alignItems: "center",
            ...fontClasses[font],
          },
          // '& fieldset': {
          //   borderRadius: '2px !important',
          // },
          // '&:hover .MuiOutlinedInput-notchedOutline': {
          //   borderColor: '#cccccc',
          // },
          // '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          //   borderColor: '#cccccc',
          //   borderWidth: 1,
          // },
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M8.73483 0.734835C8.88128 0.588388 9.11866 0.588388 9.26511 0.734835C9.41155 0.881282 9.41155 1.11866 9.26511 1.26511L5.26511 5.26511C5.11866 5.41155 4.88128 5.41155 4.73484 5.26511L0.734835 1.26511C0.588388 1.11866 0.588388 0.881282 0.734835 0.734835C0.881282 0.588388 1.11866 0.588388 1.26511 0.734835L4.99997 4.4697L8.73483 0.734835Z" fill="#1A1C20"/></svg>')}")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
            width: '10px',
            height: '6px',
          },
          ...getBorderStyles(),
        }}
      >
        {options.map((option) => (
          <MenuItem 
            key={option.value} 
            value={option.value}
            sx={{
              ...fontClasses[font],
              '&:hover': {
                backgroundColor: '#f5f5f5',
              },
              '&.Mui-selected': {
                backgroundColor: '#1976d2',
                color: 'white',
                '&:hover': {
                  backgroundColor: '#1565c0',
                },
              },
            }}
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};