const reactNativeInit = (name) => ({
    [`/${name}.js`]: {
        code: `import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function ${name}() {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Hello ${name}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontSize: 16,
        color: 'white',
    },
});

export default ${name};`,
        main: true
    }
});

export default reactNativeInit;