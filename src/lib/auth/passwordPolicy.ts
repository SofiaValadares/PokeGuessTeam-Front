export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 72;
export const PASSWORD_POLICY_HINT =
  'Mínimo de 10 caracteres, com pelo menos 1 letra maiúscula e 1 caractere especial.';

const HAS_UPPERCASE = /[A-Z]/;
const HAS_SPECIAL = /[^A-Za-z0-9]/;

export function getPasswordPolicyError(password: string): string | undefined {
  if (password.length < PASSWORD_MIN_LENGTH || password.length > PASSWORD_MAX_LENGTH) {
    return `A senha deve ter entre ${PASSWORD_MIN_LENGTH} e ${PASSWORD_MAX_LENGTH} caracteres.`;
  }
  if (!HAS_UPPERCASE.test(password) || !HAS_SPECIAL.test(password)) {
    return 'A senha precisa de pelo menos 1 letra maiúscula e 1 caractere especial.';
  }
  return undefined;
}
