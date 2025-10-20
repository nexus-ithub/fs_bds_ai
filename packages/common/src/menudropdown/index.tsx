import { FormControl, MenuItem, Select, Typography } from "@mui/material";
import { ChevronDownCustomIcon } from "../icons";

interface DropdownOption<T extends string = string> {
  value: T;
  label: string;
  url?: string;
}

interface MenuDropdownProps<T extends string = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T, option?: DropdownOption<T>) => void;
  placeholder?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  padding?: 'default' | 'minimum';
  width?: string;
  font?: 'font-b3' | 'font-s3';
  borderStyle?: 'outlined' | 'underline' | 'none';
  optionPadding?: string;
}

export const MenuDropdown = <T extends string = string>({
  options = [],
  value,
  onChange,
  placeholder = "선택하세요",
  disabled = false,
  padding = "default",
  width = "w-[160px]",
  font = "font-b3",
  borderStyle = "outlined",
  optionPadding = "4px 10px",
}: MenuDropdownProps<T>) => {
  const paddingClasses = {
    default: "6px 8px 6px 10px",
    minimum: "0px 4px",
  };

  const fontClasses = {
    'font-b3': {
      fontSize: "13px",
      fontWeight: "var(--font-weight-regular)",
      lineHeight: "20px",
    },
    'font-s3': {
      fontSize: "13px",
      fontWeight: "var(--font-weight-regular)",
      lineHeight: "16px",
    },
  };

  const getBorderStyles = () => {
    if (borderStyle === 'none') {
      return {
        '& fieldset': {
          border: 'none',
        },
        '& .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '&:hover .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
          border: 'none',
        },
      };
    }
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
      '& .MuiOutlinedInput-notchedOutline': {
        border: '1px solid #DCDEE2',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        border: '1px solid #DCDEE2',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        border: '1px solid #DCDEE2',
      },
    };
  };

  // const handleChange = (event: { target: { value: T } }) => {
  //   const selectedValue = event.target.value as T;
  //   const selectedOption = options.find((o) => o.value === selectedValue);
  //   onChange(selectedValue, selectedOption);
  // };

  return (
    <FormControl disabled={disabled} className={`${width}`}>
      <Select
        value={value || ("" as T)}
        onChange={(event) => {
          const selectedValue = event.target.value as T;
          const selectedOption = options.find((o) => o.value === selectedValue);
          onChange(selectedValue, selectedOption);
        }}
        displayEmpty
        renderValue={(selected) => {
          if (!selected) {
            return <span style={{ color: '#9EA2A8', ...fontClasses[font] }}>{placeholder}</span>;
          }
          return options.find(option => option.value === selected)?.label;
        }}
        IconComponent={() => null}
        MenuProps={{
          disableScrollLock: true,
          MenuListProps: {
            autoFocus: false,
            autoFocusItem: true,
            disablePadding: true,
            onMouseDown: (e) => e.stopPropagation(),
          },
          PaperProps: {
            sx: {
              borderRadius: 0,
              boxShadow: "0px 2px 6px rgba(0,0,0,0.1)",
            },
          },
        }}
        sx={{
          '& .MuiSelect-select': {
            padding: paddingClasses[padding],
            display: "flex",
            alignItems: "center",
            ...fontClasses[font],
          }, 
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
              padding: optionPadding,
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
            <Typography
              sx={{
                ...fontClasses[font],
                color: 'inherit', // 선택 상태에서 흰색 유지
              }}
            >
              {option.label}
            </Typography>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};