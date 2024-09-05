import { Elysia, error, NotFoundError, t, ValidationError } from "elysia";
import { db } from "./services/db";
import swagger from "@elysiajs/swagger";
import cookie from "@elysiajs/cookie";
import jwt from "@elysiajs/jwt";
import { UserModel } from "./models/user.model";
import { AuthModel } from "./models/auth.model";
import { AuthorizationError } from "./utils/exception";

const app = new Elysia()
    .use(swagger({}))
    .get("/", (app) => {
        return {
            message: `Hello ${app.server?.hostname}:${app.server?.port}!`,
            headers: app.headers
        };
    })
    .error("AUTHENTICATION", AuthorizationError)
    .onError(({ code, error, set }) => {
        if (code === "NOT_FOUND") {
            set.status = 404;
            return {
                code: error.code,
                error: error
            };
        }
        if (code === "VALIDATION") {
            set.status = 422;
            return {
                code: error.code,
                error: error
            };
        }
        if (code === "AUTHENTICATION") {
            set.status = 401;
            return {
                message: error.message,
                error: error
            };
        }
        if (code === "UNKNOWN") {
            return {
                error: error
            };
        }
    })
    .group("/api/v1", (app) =>
        app
            .use(cookie())
            .use(UserModel)
            .use(AuthModel)
            .use(
                jwt({
                    name: "jwt",
                    secret: process.env.JWT_SECRET!,
                    sub: "auth",
                    exp: "1d"
                })
            )
            .guard({
                headers: t.Object({
                    authorization: t.TemplateLiteral("Bearer ${string}")
                }),
                beforeHandle: ({ headers: { authorization } }) => {
                    const [_, token] = authorization?.split(" ") || [];
                    if (!token) {
                        throw new AuthorizationError(
                            "No Bearer token provided"
                        );
                    }
                    if (token !== process.env.APP_BEARER_TOKEN) {
                        throw new AuthorizationError("Unauthorized token");
                    }
                }
            })
            .get("/", (app) => {
                return { message: "Hello Test Auth" };
            })
            .group("/auth", (app) =>
                app

                    .post(
                        "/sign-up",
                        async ({ body, cookie: { auth }, jwt }) => {
                            //1. hash password]
                            const password_hash = await Bun.password.hash(
                                body.password,
                                {
                                    algorithm: "bcrypt",
                                    cost: 10
                                }
                            );
                            //2. create user
                            const user = await db.user.create({
                                data: {
                                    email: body.email,
                                    firstname: body.firstname,
                                    lastname: body.lastname,
                                    password_hash
                                }
                            });
                            return {
                                message: "Account created successfully",
                                data: {
                                    user
                                }
                            };
                        },
                        {
                            body: "auth.signup"
                        }
                    )
                    .post(
                        "/sign-in",
                        async ({ body, cookie: { auth }, jwt }) => {
                            const user = await db.user.findUnique({
                                where: {
                                    email: body.email
                                }
                            });

                            if (!user) {
                                return {
                                    error: "Invalid email or password"
                                };
                            }
                            const isPasswordCorrect = await Bun.password.verify(
                                body.password,
                                user.password_hash
                            );
                            if (!isPasswordCorrect) {
                                return {
                                    error: "Invalid email or password"
                                };
                            }

                            const accessToken = await jwt.sign({
                                id: user.id,
                                email: user.email,
                                firstname: user.firstname,
                                lastname: user.lastname ?? ""
                            });

                            auth.set({
                                value: accessToken,
                                httpOnly: true,
                                maxAge: 7 * 86400,
                                path: "/"
                            });

                            return {
                                success: true,
                                message:
                                    "Account login successfully as " +
                                    auth.cookie.value
                            };
                        },
                        {
                            body: "auth.signin"
                        }
                    )
                    .get("/me", async ({ cookie: { auth }, jwt }) => {
                        const profile = await jwt.verify(auth.value as string);
                        console.log(profile);

                        if (!profile) {
                            return "Unauthorized";
                        }

                        return profile;
                    })
                    .post("/sign-out", async ({ cookie, cookie: { auth } }) => {
                        auth.remove();
                        delete cookie.auth;
                        return {
                            success: true,
                            message: "Sign out successfully"
                        };
                    })
                    .get("/refresh", async ({ cookie: { auth } }) => {})
            )
            .guard(
                {
                    async beforeHandle({ jwt, cookie: { auth } }) {
                        if (!auth.value) {
                            throw new AuthorizationError("No access token");
                        }
                        const profile = await jwt.verify(auth.value);

                        if (!profile) {
                            throw new AuthorizationError(
                                "Unauthorized access token"
                            );
                        }
                    }
                },

                (app) =>
                    app
                        .get("/user", async () => db.user.findMany())
                        .get(
                            "/user/:id",
                            async ({ params }) => {
                                const user = await db.user.findUnique({
                                    where: { id: Number(params.id) }
                                });

                                if (!user) {
                                    throw new NotFoundError("User not found");
                                }

                                return user;
                            },
                            {
                                params: "user.id"
                            }
                        )
                        .patch(
                            "/user/:id",
                            async ({ params, body }) =>
                                db.user.update({
                                    where: { id: Number(params.id) },
                                    data: body
                                }),
                            {
                                body: "user.update",
                                params: "user.id"
                            }
                        )
                        .delete(
                            "/user/:id",
                            async ({ params }) =>
                                db.user.delete({
                                    where: { id: Number(params.id) }
                                }),
                            {
                                params: "user.id"
                            }
                        )
            )
    )

    .listen(3000);

console.log(
    `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
