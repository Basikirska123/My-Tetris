const Utils = {
    createMatrix(rows, cols) {
        const matrix = [];
        for (let y = 0; y < rows; y +=1) {
            matrix.push(new Array(cols).fill(0));
        }
        return matrix;
    },
// 7-bag random generator
createBag() {
    const bag = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];
// shuffle
    for (let i = bag.length -1; i > 0; i -=1) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = bag[i];
        bag[i] = bag[j];
        bag[j] = temp;
    }
    return bag;
},
};