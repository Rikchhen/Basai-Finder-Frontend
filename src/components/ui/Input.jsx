import styled, { css } from 'styled-components';

const fieldVariants = {
  outlined: css`
    border: 1px solid ${({ $invalid, theme }) => ($invalid ? theme.colors.error : theme.colors.outlineVariant)};
    background: ${({ theme }) => theme.colors.surfaceContainerLowest};
  `,
  filled: css`
    border: 1px solid transparent;
    background: ${({ theme }) => theme.colors.surfaceContainerLow};
  `,
};

export function Input({ icon: Icon, prefix, hint, error, variant = 'outlined', ...props }) {
  return (
    <Field>
      <InputShell $invalid={Boolean(error)} $variant={variant}>
        {Icon ? <Icon size={18} aria-hidden="true" /> : null}
        {prefix ? <Prefix>{prefix}</Prefix> : null}
        <Control {...props} />
      </InputShell>
      {error ? <HelpText $error>{error}</HelpText> : hint ? <HelpText>{hint}</HelpText> : null}
    </Field>
  );
}

const Field = styled.label`
  display: grid;
  gap: 6px;
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  font-size: 0.88rem;
  font-weight: 700;
`;

const InputShell = styled.span`
  display: flex;
  min-height: 46px;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(1)};
  border-radius: ${({ theme }) => theme.roundness};
  padding: 0 ${({ theme }) => theme.spacing(1.5)};
  color: ${({ theme }) => theme.colors.onSurfaceVariant};
  transition: all 200ms ease-in-out;
  ${({ $variant }) => fieldVariants[$variant]}

  &:focus-within {
    border-color: ${({ $invalid, theme }) => ($invalid ? theme.colors.error : theme.colors.primary)};
    box-shadow: 0 0 0 3px rgba(26, 79, 157, 0.12);
  }
`;

const Prefix = styled.span`
  border-right: 1px solid ${({ theme }) => theme.colors.outlineVariant};
  padding-right: ${({ theme }) => theme.spacing(1)};
  color: ${({ theme }) => theme.colors.onSurface};
  font-weight: 800;
`;

const Control = styled.input`
  width: 100%;
  min-width: 0;
  border: 0;
  outline: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.onSurface};

  &::placeholder {
    color: ${({ theme }) => theme.colors.onSurfaceVariant};
  }
`;

const HelpText = styled.span`
  color: ${({ $error, theme }) => ($error ? theme.colors.error : theme.colors.onSurfaceVariant)};
  font-size: 0.78rem;
  font-weight: 600;
`;
