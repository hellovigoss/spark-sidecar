function onShotRes(data, outBuffer) {
    return {
        "id": data.header.sid,
        "object": "chat.completion",
        "created": Math.floor(Date.now() / 1000),
        "model": "spark",
        "choices": [
            {
                "message": {
                    "role": data.payload.choices.text[0].role,
                    "content": outBuffer
                },
                "finish_reason": "stop",
                "index": 0
            }
        ],
        "usage": {
            "prompt_tokens": data.payload.usage.text.prompt_tokens,
            "completion_tokens": data.payload.usage.text.completion_tokens,
            "total_tokens": data.payload.usage.text.total_tokens
        }
    }
}

function streamRes(data) {
    return [
        {
            "choices": [
                {
                    "delta": {
                        "role": data.payload.choices.text[0].role
                    },
                    "finish_reason": null,
                    "index": data.payload.choices.text[0].index
                }
            ],
            "created": Math.floor(Date.now() / 1000),
            "id": data.header.sid,
            "model": "spark",
            "object": "chat.completion.chunk"
        },
        {
            "choices": [
                {
                    "delta": {
                        "content": data.payload.choices.text[0].content
                    },
                    "finish_reason": null,
                    "index": data.payload.choices.text[0].index
                }
            ],
            "created": Math.floor(Date.now() / 1000),
            "id": data.header.sid,
            "model": "spark",
            "object": "chat.completion.chunk"
        }
    ]
}

function streamEndRes(data) {
    return {
        "choices": [
            {
                "delta": {},
                "finish_reason": "stop",
                "index": 0
            }
        ],
        "created": Math.floor(Date.now() / 1000),
        "id": data.header.sid,
        "model": "spark",
        "object": "chat.completion.chunk"
    }

}

module.exports = { onShotRes, streamRes, streamEndRes }