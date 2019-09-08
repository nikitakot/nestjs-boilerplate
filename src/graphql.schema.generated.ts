
/** ------------------------------------------------------
 * THIS FILE WAS AUTOMATICALLY GENERATED (DO NOT MODIFY)
 * -------------------------------------------------------
 */

/* tslint:disable */
export class LoginInput {
    email: string;
    password: string;
}

export class SignUpInput {
    email: string;
    password: string;
}

export class AuthPayload {
    id: string;
    email: string;
}

export abstract class IMutation {
    abstract signup(signUpInput?: SignUpInput): AuthPayload | Promise<AuthPayload>;

    abstract login(loginInput?: LoginInput): AuthPayload | Promise<AuthPayload>;
}

export abstract class IQuery {
    abstract user(): User | Promise<User>;
}

export class User {
    id: string;
    email: string;
    createdAt: string;
    updatedAt: string;
}
