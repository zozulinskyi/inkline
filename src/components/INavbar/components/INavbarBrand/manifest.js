module.exports = {
    slots: [
        {
            name: 'default',
            description: 'Slot for default navbar brand content',
            type: []
        }
    ],
    props: [
        {
            name: 'tag',
            description: 'Set the HTML tag to be used for rendering the nav item',
            type: [
                'String'
            ],
            default: 'div'
        }
    ]
};
