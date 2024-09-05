import { Elysia, t } from "elysia";

export const AuthModel = new Elysia()
    .model({
        "auth.signup": t.Object({
            email: t.String({
                format: "email"
            }),
            password: t.String({
                minLength: 8
            }),
            firstname: t.String(),
            lastname: t.Optional(t.String())
        })
    })
    .model({
        "auth.signin": t.Object({
            email: t.String({
                format: "email"
            }),
            password: t.String({
                minLength: 8
            })
        })
    })
    .model({
        "auth.token": t.Object({
            token: t.Undefined(t.String())
        })
    });
