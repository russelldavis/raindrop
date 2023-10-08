import s from './index.module.styl'
import React, { useCallback, useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { suggestFields } from '~data/actions/bookmarks'

import { Layout, Separator, Group } from '~co/common/form'
import Cover from './cover'
import Note from './note'
import Collection from './collection'
import Tags from './tags'
import Action from './action'
import Title from './title'
import Link from './link'
import Reminder from './reminder'
import Important from './important'
import Date from './date'
import browser from '~target/extension/browser'

export default function BookmarkEditForm(props) {
    const dispatch = useDispatch()

    //load suggestions
    useEffect(()=>
        dispatch(suggestFields(props.item)),
        [props.item._id, props.item.media]
    )

    const onSubmitForm = useCallback(async e=>{
        e.preventDefault()
        e.stopPropagation()
        
        if (props.item.excerpt === 'null') {
            await props.onChange({excerpt: ''})
        }
        await browser.runtime.sendMessage(null, { type: 'BOOKMARK_SUBMITTED', url: props.item.link })

        props.onSave().then(()=>{
            if (props.autoWindowClose)
                window.close()
        })
    }, [props.onSave, props.autoWindowClose])

    return (
        <form 
            className={s.form}
            data-status={props.status}
            onSubmit={onSubmitForm}>
            <Layout type='grid'>
                <Cover {...props} />
                <Title  {...props} />
                <Note {...props} />
                
                <Collection {...props} />
                <Tags {...props} />
                <Link {...props} />

                <div />
                <Group>
                    <Important {...props} />
                    <Reminder {...props} />
                </Group>
                
                <Date {...props} />

                <Separator variant='transparent' />
                
                <Action {...props} />
            </Layout>
        </form>
    )
}