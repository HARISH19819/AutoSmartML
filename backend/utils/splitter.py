from sklearn.model_selection import train_test_split


def split_dataset(df, target_column, test_size):

    X = df.drop(columns=[target_column])
    y = df[target_column]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=test_size,
        random_state=42
    )

    result = {
        "X_train_rows": X_train.shape[0],
        "X_test_rows": X_test.shape[0],
        "features": X_train.shape[1]
    }

    return result
