import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isStrongPassword', async: false })
export class IsStrongPasswordConstraint implements ValidatorConstraintInterface {
  validate(password: string) {
    if (!password || typeof password !== 'string') {
      return false;
    }

    // Ít nhất 1 chữ in hoa
    const hasUpperCase = /[A-Z]/.test(password);

    // Ít nhất 1 ký tự đặc biệt
    const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

    // Ít nhất 2 số
    const digitCount = (password.match(/\d/g) || []).length;
    const hasAtLeastTwoDigits = digitCount >= 2;

    return hasUpperCase && hasSpecialChar && hasAtLeastTwoDigits;
  }

  defaultMessage() {
    return 'Mật khẩu phải chứa ít nhất 1 chữ in hoa, 1 ký tự đặc biệt và ít nhất 2 số';
  }
}

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsStrongPasswordConstraint,
    });
  };
}


