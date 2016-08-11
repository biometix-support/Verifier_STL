module.exports = {
    image: {
        document: {
            moreThan: 2048, //kbytes
            method: 'resize', //resize or compress
            // resize options
            options: {
                maxWidth: 1000,
                maxHeight: 1000
            }
        }
    }
};