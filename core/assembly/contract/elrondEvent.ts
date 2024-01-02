import {ElrondArray, ElrondString, ElrondU32, ManagedType, MultiValue} from "../types";
import {
    managedWriteLog
} from "../utils/env";

export class ElrondEvent<T extends MultiValue, D extends ManagedType> {

    constructor(
        private name: ElrondString,
        private topics: T,
        private data: D
    ) {}

    emit(): void {
        const topics = new ElrondArray<ElrondString>()

        topics.push(this.name)

        for (let i = ElrondU32.zero(); i < this.topics.items.getLength(); i++) {
            const topic = this.topics.items.get(i)
            topics.push(topic.utils.encodeTop())
        }

        managedWriteLog(
            topics.getHandle(),
            this.data.utils.encodeTop().getHandle()
        )
    }

}
