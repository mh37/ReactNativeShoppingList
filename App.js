
import { useState, useEffect } from "react";
import { Header, Icon, Input, Button, ListItem } from'react-native-elements';
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Constants from "expo-constants";
import * as SQLite from "expo-sqlite";

function openDatabase() {
  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("db.db");
  return db;
}

const db = openDatabase();

function Items({onPressItem}) {
  const [items, setItems] = useState(null);

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        `select * from items;`, [],
        (_, { rows: { _array } }) => setItems(_array)
      );
    });
  }, []);

  const heading = "Items";

  if (items === null || items.length === 0) {
    return null;
  }

  return (
    <View style={styles.sectionContainer}>
      <Text style={styles.sectionHeading}>{heading}</Text>
      {items.map(({ id, value, amount }) => (
        <ListItem bottomDivider>
          <ListItem.Content>
            <ListItem.Title>{value +", "+ amount }
              <Icon style={{
                flexDirection: 'row-reverse'
              }}
                type="material" 
                name="delete" 
                key={id}
                onPress={() => onPressItem && onPressItem(id)}
              />
              </ListItem.Title>
          </ListItem.Content>
        </ListItem>

      ))}
    </View>
  );
}

export default function App() {
  const [productText, setProductText] = useState(null);
  const [amountText, setAmountText] = useState(null);
  const [forceUpdate, forceUpdateId] = useForceUpdate();

  useEffect(() => {
    db.transaction((tx) => {
      tx.executeSql(
        "create table if not exists items (id integer primary key not null, amount text, value text);"
      );
    });
  }, []);

  const add = (productText, amountText) => {
    // is text empty?
    if (productText === null || productText === "") {
      return false;
    }

    db.transaction(
      (tx) => {
        tx.executeSql("insert into items (amount, value) values (?,?)", [amountText, productText]);
        tx.executeSql("select * from items", [], (_, { rows }) =>
          console.log(JSON.stringify(rows))
        );
      },
      null,
      forceUpdate
    );
  };

  return (
    <View style={styles.container}>
      <Header  
        centerComponent={{ text: 'SHOPPING LIST', style: { color: '#fff' } }}  
      />
        <>
          <View style={styles.flexRow}>
            <Input   
              placeholder='Product' 
              label='Product'  
              onChangeText={(productText) => setProductText(productText)}
              value={productText} 
            />
            <Input   
              placeholder='Amount' 
              label='Amount'  
              onChangeText={(amountText) => setAmountText(amountText)}
              value={amountText} 
            />
            <Button 
              raised icon={{name: 'save'}}
              title="Save"
              onPress={() => {
                add(productText, amountText);
                setProductText(null);
                setAmountText(null);
              }}
            />
          </View>
          <ScrollView style={styles.listArea}>
            <Items
              key={`forceupdate-todo-${forceUpdateId}`}
              onPressItem={(id) =>
                db.transaction(
                  (tx) => {
                    tx.executeSql(`delete from items where id = ?;`, [
                      id,
                    ]);
                  },
                  null,
                  forceUpdate
                )
              }
            />
          </ScrollView>
        </>
    </View>
  );
}

function useForceUpdate() {
  const [value, setValue] = useState(0);
  return [() => setValue(value + 1), value];
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 1,
    paddingTop: Constants.statusBarHeight,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
  },
  flexRow: {
    flex: 1
  },
  listArea: {
    backgroundColor: "#f0f0f0",
    flex: 1,
    paddingTop: 16,
  },
  sectionContainer: {
    marginBottom: 16,
    marginHorizontal: 16,
  },
  sectionHeading: {
    fontSize: 18,
    marginBottom: 8,
  },
});
