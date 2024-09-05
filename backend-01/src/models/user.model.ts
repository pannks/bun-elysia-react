import { Elysia, t } from "elysia";

export const UserModel = new Elysia()
    .model({
        "user.create": t.Object({
            email: t.String(),
            firstname: t.String(),
            lastname: t.Optional(t.String()),
            password: t.String()
        })
    })
    .model({
        "user.update": t.Partial(
            t.Object({
                email: t.String(),
                firstname: t.String(),
                lastname: t.Optional(t.String()),
                password: t.String()
            })
        )
    })
    .model({
        "user.id": t.Object({
            id: t.Number()
        })
    });
