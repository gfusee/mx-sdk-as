import {ManagedArray, ManagedBuffer, ManagedU32, ManagedType, MultiValue} from "../types";
import {
    managedWriteLog
} from "../utils/env";

export class ManagedEvent<T extends MultiValue, D extends ManagedType> {

    constructor(
        private name: ManagedBuffer,
        private topics: T,
        private data: D
    ) {}

    emit(): void {
        const topics = new ManagedArray<ManagedBuffer>()

        topics.push(this.name)

        for (let i = ManagedU32.zero(); i < this.topics.items.getLength(); i++) {
            const topic = this.topics.items.get(i)
            topics.push(topic.utils.encodeTop())
        }

        managedWriteLog(
            topics.getHandle(),
            this.data.utils.encodeTop().getHandle()
        )
    }

}
