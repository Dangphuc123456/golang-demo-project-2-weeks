package service

import (
    "context"
)

type key string

const userKey key = "user"

func SetUserContext(ctx context.Context, claims *Claims) context.Context {
    return context.WithValue(ctx, userKey, claims)
}

func GetUserFromContext(ctx context.Context) *Claims {
    if claims, ok := ctx.Value(userKey).(*Claims); ok {
        return claims
    }
    return nil
}
