const reactNativeTsInit = (name) => ({
    [`/${name}.tsx`]: {
        code: `import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ${name}Props {
    title?: string;
    onPress?: () => void;
}

interface Styles {
    container: ViewStyle;
    text: TextStyle;
}

const ${name}: React.FC<${name}Props> = ({ title = '${name}' }) => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Hello {title}</Text>
        </View>
    );
};

const styles = StyleSheet.create<Styles>({
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

export default reactNativeTsInit;

