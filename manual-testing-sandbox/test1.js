
const student = {
    "RedHouse": [{name: 'Ali', age: 20}, {name: 'Mohammad', age: 19}],
    "GreenHouse": [{name: 'Sara', age: 25}, {name: 'John', age: 30}],
    "BlueHouse": [{name: 'Ali', age: 20}, {name: 'Mohammad', age: 19}]
}

const convertToArray = (obj) => {
    return Object.values(obj).reduce((acc, curr) => {
        acc = [...acc, ...curr.map(item => ({ ...item, house: curr }))];
        return acc;
    }, []);
}

convertToArray(student)
